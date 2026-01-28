<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useCropper } from '@/composables/useCropper'
import { getOptimizedBlob } from '@/utils/imageUtils'
import MovableCroppingEditor from './MovableCroppingEditor.vue'
import CropperResultPreview from './CropperResultPreview.vue'

interface Props {
  /** 裁切框初始覆蓋比例 (範圍: 0.1 ~ 1.0) */
  initialCoverage?: number
  /** 最大檔案大小限制，單位 bytes (建議: 1MB ~ 50MB) */
  maxFileSize?: number
  /** 裁切框長寬比 (width / height)，例如 9/16 = 0.5625 */
  aspectRatio?: number
  /** 是否顯示即時預覽 */
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

if (props.initialCoverage < 0.1 || props.initialCoverage > 1) {
  console.warn(
    `[MovableCroppingContainer] initialCoverage 應介於 0.1 ~ 1.0，目前值: ${props.initialCoverage}`,
  )
}

if (props.maxFileSize < 1024 * 1024 || props.maxFileSize > 50 * 1024 * 1024) {
  console.warn(
    `[MovableCroppingContainer] maxFileSize 建議介於 1MB ~ 50MB，目前值: ${(props.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
  )
}

if (props.aspectRatio <= 0) {
  console.warn(`[MovableCroppingContainer] aspectRatio 必須大於 0，目前值: ${props.aspectRatio}`)
}

const { ACCEPT_STRING, imageUrl, imageName, loadImage, clear } = useCropper(props.maxFileSize)

const selectionId = `cropper-selection-${crypto.randomUUID()}`

const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref<string>('')
const selectionRef = ref<InstanceType<typeof MovableCroppingEditor> | null>(null)

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

const handleCancel = () => {
  clear()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  errorMessage.value = ''
}

const handleLoadError = (error: Error) => {
  errorMessage.value = error.message || '圖片載入失敗'
}

const handleDownload = async () => {
  const editor = selectionRef.value
  if (!editor) {
    errorMessage.value = '產生裁切圖片失敗'
    return
  }

  try {
    const canvas = await editor.toCanvas()
    if (!canvas) {
      errorMessage.value = '產生裁切圖片失敗'
      return
    }

    const { blob, extension } = await getOptimizedBlob(canvas)

    if (!blob) {
      errorMessage.value = '產生裁切圖片失敗'
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // 使用新的副檔名 (例如 .webp)
    a.download = `cropped-${Date.now()}${extension}`
    a.click()
    URL.revokeObjectURL(url)

    emit('download', blob)
  } catch {
    errorMessage.value = '產生裁切圖片失敗'
  }
}

const handleUpload = async () => {
  const editor = selectionRef.value
  if (!editor) {
    errorMessage.value = '產生裁切圖片失敗'
    return
  }

  try {
    const canvas = await editor.toCanvas()
    if (!canvas) {
      errorMessage.value = '產生裁切圖片失敗'
      return
    }

    const { blob, extension } = await getOptimizedBlob(canvas)

    if (!blob) {
      errorMessage.value = '產生裁切圖片失敗'
      return
    }
    // 替換副檔名為新的格式 (例如 .jpg -> .webp)
    const fileName = imageName.value.replace(/\.[^.]+$/, () => `-cropped${extension}`)
    const file = new File([blob], fileName, { type: blob.type })
    emit('upload', file)
  } catch {
    errorMessage.value = '產生裁切圖片失敗'
  }
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
          <MovableCroppingEditor
            ref="selectionRef"
            :image-url="imageUrl"
            :initial-coverage="initialCoverage"
            :aspect-ratio="aspectRatio"
            :selection-id="selectionId"
            @trigger-file-input="triggerFileInput"
            @load-error="handleLoadError"
          />
        </div>

        <div v-if="showPreview" class="cropper-section">
          <div class="section-title">即時預覽</div>
          <CropperResultPreview
            :image-url="imageUrl"
            :aspect-ratio="aspectRatio"
            :selection-selector="`#${selectionId}`"
          />
        </div>
      </div>

      <div class="controls">
        <div class="controls-left">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="!imageUrl"
            @click="handleCancel"
          >
            取消
          </button>
        </div>
        <div class="controls-right">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!imageUrl"
            @click="handleDownload"
          >
            下載
          </button>
          <button type="button" class="btn btn-success" :disabled="!imageUrl" @click="handleUpload">
            上傳
          </button>
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
  max-width: 640px;
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

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #059669;
}
</style>
