<template>
  <div class="image-cropper">
    <div class="upload-section">
      <input
        ref="fileInput"
        type="file"
        :accept="ACCEPT_STRING"
        class="file-input"
        @change="handleFileSelect"
      />
      <button type="button" class="btn btn-primary" @click="triggerFileInput">選擇圖片</button>
      <span v-if="errorMessage" class="error-message">{{ errorMessage }}</span>
    </div>

    <div v-if="imageUrl" class="cropper-container">
      <div class="cropper-main">
        <div class="cropper-editor">
          <cropper-canvas background>
            <cropper-image :src="imageUrl" alt="Source Image" scalable translatable></cropper-image>
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
        </div>

        <div class="cropper-preview">
          <div class="preview-title">即時預覽</div>
          <cropper-viewer
            v-if="selectionRef"
            :selection="selectionRef"
            class="viewer"
          ></cropper-viewer>
        </div>
      </div>

      <div class="crop-info">
        <span>📐 裁切資訊：</span>
        <span
          >寬 {{ Math.round(cropData.width) }} px × 高 {{ Math.round(cropData.height) }} px</span
        >
      </div>

      <div class="controls">
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
import { ref, onUnmounted } from 'vue'
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

.upload-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.file-input {
  display: none;
}

.error-message {
  color: #ef4444;
  font-size: 14px;
}

.cropper-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cropper-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .cropper-main {
    grid-template-columns: 1fr;
  }
}

.cropper-editor {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

cropper-canvas {
  display: block;
  height: 500px;
  width: 100%;
}

.cropper-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.viewer {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 9 / 16;
  width: 100%;
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
