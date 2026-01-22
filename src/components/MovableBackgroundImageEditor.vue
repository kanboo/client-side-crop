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

watch(
  () => props.imageUrl,
  async () => {
    if (!props.imageUrl) return
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
          skewable
          translatable
        ></cropper-image>
        <cropper-handle action="move" plain />
        <cropper-selection
          id="cropper-selection-main"
          ref="selectionRef"
          :initial-coverage="initialCoverage"
          :aspect-ratio="aspectRatio"
        >
          <cropper-grid></cropper-grid>
          <cropper-crosshair centered theme-color="transparent"></cropper-crosshair>
          <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
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
