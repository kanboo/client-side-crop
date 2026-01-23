<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import 'cropperjs'
import type { CropperSelection, CropperImage } from 'cropperjs'

interface Props {
  imageUrl: string
  initialCoverage: number
  aspectRatio: number
  selectionId?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectionId: 'cropper-selection-main',
})

const selectionRef = ref<CropperSelection | null>(null)
const cropperImageRef = ref<CropperImage | null>(null)

const toCanvas = async () => {
  const selection = selectionRef.value
  const image = cropperImageRef.value

  if (!selection || !image) return undefined

  // 取得圖片的變換矩陣
  const matrix = image.$getTransform()
  // 計算縮放比例（假設為等比縮放或至少取得水平縮放比例）
  // 矩陣格式為 [scaleX, skewY, skewX, scaleY, translateX, translateY]
  // 相對於原始尺寸的縮放因子計算方式為 hypot(scaleX, skewY)
  const scale = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1])

  // 目前選取框的尺寸（Canvas 像素）
  const { width, height } = selection

  // 計算目標尺寸（原始圖片像素）
  const targetWidth = Math.round(width / scale)
  const targetHeight = Math.round(height / scale)

  return selection.$toCanvas({
    width: targetWidth,
    height: targetHeight,
  })
}

const onTransform = (event: CustomEvent) => {
  const selection = selectionRef.value
  const image = cropperImageRef.value
  if (!selection || !image) return

  const selectionRect = selection.getBoundingClientRect()
  const canvas = image.parentElement as HTMLElement
  if (!canvas) return

  // 1. 複製 cropper image 元素
  const imageClone = image.cloneNode() as CropperImage

  // 2. 將新的變換矩陣應用到複製的圖片上
  imageClone.style.transform = `matrix(${event.detail.matrix.join(', ')})`

  // 3. 隱藏複製的圖片
  imageClone.style.opacity = '0'
  imageClone.style.pointerEvents = 'none'

  // 4. 將複製的圖片加入到 cropper canvas 中
  canvas.appendChild(imageClone)

  // 5. 計算複製圖片的邊界
  const imageRect = imageClone.getBoundingClientRect()

  // 6. 移除複製的圖片
  canvas.removeChild(imageClone)

  // 7. 如果圖片沒有完全覆蓋選取範圍，則阻止變換
  // 圖片覆蓋選取範圍的條件：
  // image.top <= selection.top
  // image.right >= selection.right
  // image.bottom >= selection.bottom
  // image.left <= selection.left
  if (
    imageRect.top > selectionRect.top ||
    imageRect.right < selectionRect.right ||
    imageRect.bottom < selectionRect.bottom ||
    imageRect.left > selectionRect.left
  ) {
    event.preventDefault()
  }
}

defineExpose({
  selectionRef,
  toCanvas,
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
          ref="cropperImageRef"
          :src="imageUrl"
          alt="Source Image"
          initial-center-size="cover"
          scalable
          skewable
          translatable
          @transform="onTransform"
        ></cropper-image>
        <cropper-handle action="move" plain />
        <cropper-selection
          :id="selectionId"
          ref="selectionRef"
          :initial-coverage="initialCoverage"
          :aspect-ratio="aspectRatio"
        >
          <cropper-grid bordered covered rows="1" columns="1" theme-color="#000000"></cropper-grid>
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
  aspect-ratio: v-bind(aspectRatio);
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
