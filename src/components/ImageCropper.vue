<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useCropper, type CropData } from '@/composables/useCropper'
import CropperEditor from './CropperEditor.vue'
import CropperPreview from './CropperPreview.vue'

interface Props {
  initialCoverage?: number
  maxFileSize?: number
  aspectRatio?: number
  showPreview?: boolean
}

interface Emits {
  (e: 'upload', file: File): void
  (e: 'download', blob: Blob): void
}

const props = withDefaults(defineProps<Props>(), {
  initialCoverage: 0.7,
  maxFileSize: 10 * 1024 * 1024,
  aspectRatio: 9 / 16,
  showPreview: true,
})

const emit = defineEmits<Emits>()

const {
  ACCEPT_STRING,
  imageUrl,
  imageName,
  imageMimeType,
  cropData,
  loadImage,
  updateCropData,
  clear,
} = useCropper(props.maxFileSize)

const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref<string>('')

// Preview canvas state
const currentPreviewCanvas = ref<HTMLCanvasElement | null>(null)

const handleCanvasUpdate = (canvas: HTMLCanvasElement | null) => {
  currentPreviewCanvas.value = canvas
}

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

const handleSelectionChange = (detail: CropData) => {
  updateCropData(detail)
}

const handleCancel = () => {
  clear()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  errorMessage.value = ''
  currentPreviewCanvas.value = null
}

const handleDownload = async () => {
  const canvas = currentPreviewCanvas.value
  if (!canvas) {
    errorMessage.value = '產生裁切圖片失敗'
    return
  }

  canvas.toBlob((blob) => {
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
  }, imageMimeType.value || 'image/png')
}

const handleUpload = async () => {
  const canvas = currentPreviewCanvas.value
  if (!canvas) {
    errorMessage.value = '產生裁切圖片失敗'
    return
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      errorMessage.value = '產生裁切圖片失敗'
      return
    }
    const fileName = imageName.value.replace(/\.[^.]+$/, (ext) => `-cropped${ext}`)
    const file = new File([blob], fileName, { type: blob.type })
    emit('upload', file)
  }, imageMimeType.value || 'image/png')
}

onUnmounted(() => {
  clear()
})
</script>

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
      <div class="cropper-main" :class="{ 'single-column': !showPreview }">
        <div class="cropper-section">
          <div class="section-title">原圖裁切</div>
          <CropperEditor
            :image-url="imageUrl"
            :initial-coverage="initialCoverage"
            :aspect-ratio="aspectRatio"
            @trigger-file-input="triggerFileInput"
            @change="handleSelectionChange"
            @update-canvas="handleCanvasUpdate"
          />
        </div>

        <div v-if="showPreview" class="cropper-section">
          <div class="section-title">即時預覽</div>
          <CropperPreview :preview-canvas="currentPreviewCanvas" />
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

.cropper-main.single-column {
  grid-template-columns: 1fr;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
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
