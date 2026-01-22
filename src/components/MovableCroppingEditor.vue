<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import 'cropperjs'
import type { CropperSelection } from 'cropperjs'

interface Props {
  imageUrl: string
  initialCoverage: number
  aspectRatio: number
}

const props = defineProps<Props>()

const selectionRef = ref<CropperSelection | null>(null)

defineExpose({
  selectionRef,
})

// 標記是否允許縮放變換（上傳圖片後短時間內允許）
const allowScaleTransform = ref(false)
let scaleTransformTimer: ReturnType<typeof setTimeout> | null = null

// 處理圖片變換事件，上傳期間允許，後續禁止縮放
const handleImageTransform = (event: Event) => {
  // 第一次觸發時開始計時
  if (allowScaleTransform.value && scaleTransformTimer === null) {
    scaleTransformTimer = setTimeout(() => {
      allowScaleTransform.value = false
      scaleTransformTimer = null
    }, 500)
  }

  // 如果在允許期間，直接通過
  if (allowScaleTransform.value) {
    return
  }

  // 禁止一切對圖片的變換
  event.preventDefault()
}

watch(
  () => props.imageUrl,
  async () => {
    if (!props.imageUrl) return

    // 清除舊的計時器（如果存在）
    if (scaleTransformTimer !== null) {
      clearTimeout(scaleTransformTimer)
      scaleTransformTimer = null
    }

    // 開啟允許縮放的時間窗口（讓 contain 自動縮放可以執行）
    // 計時會在第一次觸發 handleImageTransform 時開始
    allowScaleTransform.value = true

    await nextTick()
  },
)
</script>

<template>
  <div
    class="cropper-editor"
    :class="{ 'is-empty': !imageUrl }"
    @click="!imageUrl && $emit('trigger-file-input')"
  >
    <template v-if="imageUrl">
      <cropper-canvas background>
        <cropper-image
          :src="imageUrl"
          alt="Source Image"
          initial-center-size="contain"
          scalable
          translatable
          @transform="handleImageTransform"
        ></cropper-image>
        <cropper-handle />
        <cropper-selection
          id="cropper-selection-main"
          ref="selectionRef"
          :initial-coverage="initialCoverage"
          :aspect-ratio="aspectRatio"
          movable
          resizable
          zoomable
        >
          <cropper-grid></cropper-grid>
          <cropper-crosshair centered theme-color="transparent"></cropper-crosshair>
          <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
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
      <div class="upload-hint">支援 JPG、PNG、GIF、WebP、BMP、HEIC、AVIF</div>
    </div>
  </div>
</template>

<style scoped>
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
</style>
