<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import 'cropperjs'
import type { CropperSelection, CropperCanvas, CropperImage } from 'cropperjs'
import type { CropData } from '@/composables/useCropper'

interface Props {
  imageUrl: string
  initialCoverage: number
  aspectRatio: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'trigger-file-input'): void
  (e: 'change', detail: CropData): void
  (e: 'update-canvas', canvas: HTMLCanvasElement | null): void
}>()

const selectionRef = ref<CropperSelection | null>(null)
const canvasRef = ref<CropperCanvas | null>(null)
const imageRef = ref<CropperImage | null>(null)

const handleSelectionChange = async (event: Event) => {
  const customEvent = event as CustomEvent<CropData>
  const { x, y, width, height } = customEvent.detail

  if (canvasRef.value && imageRef.value) {
    const canvasRect = canvasRef.value.getBoundingClientRect()

    const limit = {
      x: 0,
      y: 0,
      width: canvasRect.width,
      height: canvasRect.height,
    }

    const isWithin =
      x >= limit.x &&
      y >= limit.y &&
      x + width <= limit.x + limit.width &&
      y + height <= limit.y + limit.height

    if (!isWithin) {
      event.preventDefault()
      return
    }
  }

  emit('change', customEvent.detail)

  if (selectionRef.value) {
    const canvas = await selectionRef.value.$toCanvas()
    emit('update-canvas', canvas)
  }
}

watch(
  () => props.imageUrl,
  async () => {
    if (!props.imageUrl) return
    await nextTick()
    setTimeout(async () => {
      if (selectionRef.value) {
        const canvas = await selectionRef.value.$toCanvas()
        emit('update-canvas', canvas)
      }
    }, 200)
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
      <cropper-canvas ref="canvasRef" background>
        <cropper-image
          ref="imageRef"
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
