<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface Props {
  previewCanvas?: HTMLCanvasElement | null
}

const props = defineProps<Props>()

const canvasElement = ref<HTMLCanvasElement | null>(null)

const drawPreview = () => {
  const canvas = canvasElement.value
  const sourceCanvas = props.previewCanvas

  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (!sourceCanvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    return
  }

  canvas.width = sourceCanvas.width
  canvas.height = sourceCanvas.height
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(sourceCanvas, 0, 0)
}

watch(() => props.previewCanvas, drawPreview)
onMounted(drawPreview)
</script>

<template>
  <div class="preview-wrapper">
    <canvas v-show="previewCanvas" ref="canvasElement" class="preview-canvas"></canvas>
    <div v-if="!previewCanvas" class="empty-state">
      <div class="preview-placeholder-text">預覽區域</div>
    </div>
  </div>
</template>

<style scoped>
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.preview-placeholder-text {
  font-size: 14px;
  color: #9ca3af;
}
</style>
