<template>
  <div class="image-cropper">
    <input
      ref="fileInput"
      type="file"
      :accept="ACCEPT_STRING"
      class="file-input"
      @change="handleFileSelect"
    />

    <div v-if="errorMessage" class="error-banner">
      <span class="error-message">{{ errorMessage }}</span>
    </div>

    <div class="cropper-container">
      <div class="cropper-main">
        <div class="cropper-section">
          <div class="section-title">原圖裁切</div>
          <div
            class="cropper-editor"
            :class="{ 'is-empty': !imageUrl }"
            @click="!imageUrl && triggerFileInput()"
          >
            <template v-if="imageUrl">
              <cropper-canvas background>
                <cropper-image
                  :src="imageUrl"
                  alt="Source Image"
                  scalable
                  translatable
                ></cropper-image>
                <cropper-shade hidden></cropper-shade>
                <cropper-selection
                  ref="selectionRef"
                  :initial-coverage="initialCoverage"
                  :aspect-ratio="aspectRatio"
                  movable
                  resizable
                  zoomable
                  @change="handleSelectionChange"
                >
                  <cropper-grid role="grid" covered></cropper-grid>
                  <cropper-crosshair centered></cropper-crosshair>
                  <cropper-handle
                    action="move"
                    theme-color="rgba(255, 255, 255, 0.35)"
                  ></cropper-handle>
                  <cropper-handle action="n-resize"></cropper-handle>
                  <cropper-handle action="e-resize"></cropper-handle>
                  <cropper-handle action="s-resize"></cropper-handle>
                  <cropper-handle action="w-resize"></cropper-handle>
                  <cropper-handle action="ne-resize"></cropper-handle>
                  <cropper-handle action="nw-resize"></cropper-handle>
                  <cropper-handle action="se-resize"></cropper-handle>
                  <cropper-handle action="sw-resize"></cropper-handle>
                </cropper-selection>
              </cropper-canvas>
            </template>
            <div v-else class="empty-state">
              <div class="upload-icon">📷</div>
              <div class="upload-text">點擊此處上傳圖片</div>
              <div class="upload-hint">支援 JPG、PNG、GIF、WebP、BMP</div>
            </div>
          </div>
        </div>

        <div class="cropper-section">
          <div class="section-title">即時預覽</div>
          <div class="preview-wrapper">
            <canvas v-if="imageUrl" ref="previewCanvas" class="preview-canvas"></canvas>
            <div v-else class="empty-state">
              <div class="preview-placeholder-text">預覽區域</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="imageUrl" class="crop-info">
        <span>📐 裁切資訊：</span>
        <span
          >寬 {{ Math.round(cropData.width) }} px × 高 {{ Math.round(cropData.height) }} px</span
        >
      </div>

      <div v-if="imageUrl" class="controls">
        <div class="controls-left">
          <button type="button" class="btn btn-secondary" @click="handleReset">重設</button>
          <button type="button" class="btn btn-secondary" @click="handleCancel">取消</button>
        </div>
        <div class="controls-right">
          <button type="button" class="btn btn-primary" @click="handleDownload">下載</button>
          <button type="button" class="btn btn-success" @click="handleUpload">上傳</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue'
import 'cropperjs'
import { useCropper } from '@/composables/useCropper'

interface Props {
  initialCoverage?: number
  maxFileSize?: number
  aspectRatio?: number
}

interface Emits {
  (e: 'upload', file: File): void
  (e: 'download', blob: Blob): void
}

const props = withDefaults(defineProps<Props>(), {
  initialCoverage: 0.7,
  maxFileSize: 10 * 1024 * 1024,
  aspectRatio: 9 / 16,
})

const emit = defineEmits<Emits>()

const {
  ACCEPT_STRING,
  imageUrl,
  cropData,
  selectionRef,
  loadImage,
  updateCropData,
  getCroppedBlob,
  getCroppedFile,
  reset,
  clear,
} = useCropper(props.maxFileSize)

const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref<string>('')
const previewCanvas = ref<HTMLCanvasElement | null>(null)

const updatePreview = async () => {
  if (!selectionRef.value || !previewCanvas.value) return

  try {
    const canvas = await selectionRef.value.$toCanvas()
    const ctx = previewCanvas.value.getContext('2d')
    if (!ctx) return

    previewCanvas.value.width = canvas.width
    previewCanvas.value.height = canvas.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(canvas, 0, 0)
  } catch (error) {
    console.error('Preview update failed:', error)
  }
}

watch(cropData, () => {
  nextTick(() => {
    updatePreview()
  })
})

watch(imageUrl, () => {
  if (imageUrl.value) {
    nextTick(() => {
      setTimeout(updatePreview, 100)
    })
  }
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  errorMessage.value = ''
  const result = loadImage(file)

  if (!result.valid) {
    errorMessage.value = result.error || '載入圖片失敗'
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const handleSelectionChange = (event: Event) => {
  const detail = (event as CustomEvent).detail
  updateCropData(detail)
}

const handleReset = () => {
  reset()
}

const handleCancel = () => {
  clear()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  errorMessage.value = ''
  if (previewCanvas.value) {
    const ctx = previewCanvas.value.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, previewCanvas.value.width, previewCanvas.value.height)
    }
  }
}

const handleDownload = async () => {
  const blob = await getCroppedBlob()
  if (!blob) {
    errorMessage.value = '產生裁切圖片失敗'
    return
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cropped-${Date.now()}.${blob.type.split('/')[1]}`
  a.click()
  URL.revokeObjectURL(url)

  emit('download', blob)
}

const handleUpload = async () => {
  const file = await getCroppedFile()
  if (!file) {
    errorMessage.value = '產生裁切圖片失敗'
    return
  }

  emit('upload', file)
}

onUnmounted(() => {
  clear()
})
</script>

<style scoped>
.image-cropper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.file-input {
  display: none;
}

.error-banner {
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.error-message {
  color: #dc2626;
  font-size: 14px;
  font-weight: 500;
}

.cropper-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cropper-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .cropper-main {
    grid-template-columns: 1fr;
  }
}

.cropper-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.cropper-editor {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 9 / 16;
  position: relative;
}

.cropper-editor.is-empty {
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
}

.cropper-editor.is-empty:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

cropper-canvas {
  display: block;
  height: 100%;
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #9ca3af;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.5;
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
}

.upload-hint {
  font-size: 13px;
  color: #9ca3af;
}

.preview-wrapper {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 9 / 16;
  width: 100%;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-placeholder-text {
  font-size: 14px;
  color: #9ca3af;
}

.crop-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f3f4f6;
  border-radius: 6px;
  font-size: 14px;
  color: #4b5563;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.controls-left,
.controls-right {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}
</style>
