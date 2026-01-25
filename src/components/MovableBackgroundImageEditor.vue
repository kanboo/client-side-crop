<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import 'cropperjs'
import type { CropperSelection, CropperImage } from 'cropperjs'
import { calculateFitSelection } from '@/composables/useCropperCalculation'
import { useHeicSupport } from '@/composables/useHeicSupport'

interface Props {
  /** 圖片 URL */
  imageUrl: string
  /** 裁切框初始覆蓋比例 (範圍: 0.1 ~ 1.0) */
  initialCoverage: number
  /** 裁切框長寬比 (width / height) */
  aspectRatio: number
  /** Cropper Selection 元素的 ID */
  selectionId?: string
}

interface Emits {
  (e: 'trigger-file-input'): void
  (e: 'load-error', error: Error): void
}

const props = withDefaults(defineProps<Props>(), {
  selectionId: 'cropper-selection-main',
})

const emit = defineEmits<Emits>()

const { isSupported: isHeicSupported } = useHeicSupport()

const uploadHint = computed(() => {
  const formats = ['JPG', 'PNG', 'GIF', 'WebP', 'BMP']
  if (isHeicSupported.value) {
    formats.push('HEIC')
  }
  formats.push('AVIF')
  return `支援 ${formats.join('、')}`
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

// 標記是否允許縮放變換（上傳圖片後短時間內允許）
const allowScaleTransform = ref(false)

// 檢查變換後的圖片是否在選取範圍內
const isTransformWithinSelection = (
  image: CropperImage,
  selection: CropperSelection,
  matrix: number[],
) => {
  const canvas = image.parentElement as HTMLElement
  if (!canvas) return true

  const selectionRect = selection.getBoundingClientRect()

  // 1. 複製 cropper image 元素
  const imageClone = image.cloneNode() as CropperImage

  // 2. 將新的變換矩陣應用到複製的圖片上
  imageClone.style.transform = `matrix(${matrix.join(', ')})`

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
    return false
  }

  return true
}

// 處理圖片變換事件
// Workaround: Cropper.js v2 的 initial-center-size="contain" 依賴 translatable 與 scalable 屬性
// 若直接將該屬性設為 false，圖片將無法自動置中與縮放。
// 因此我們在上傳圖片後的短暫時間內允許變換 (allowScaleTransform = true)，
// 待 initial layout 完成後，再透過此事件處理器攔截後續的使用者操作 (allowScaleTransform = false)。
const onTransform = (event: CustomEvent) => {
  // 如果在允許期間，直接通過
  if (allowScaleTransform.value) {
    return
  }

  // 進行邊界檢查
  const selection = selectionRef.value
  const image = cropperImageRef.value
  if (!selection || !image) return

  if (!isTransformWithinSelection(image, selection, event.detail.matrix)) {
    event.preventDefault()
  }
}

// 自動將裁切框縮放到圖片範圍內 (保持比例)
//
// [為什麼需要這個函式？]
// Cropper.js 原生的 initial-coverage 屬性是用來設定裁切框佔「容器 (Canvas)」的比例，而不是佔「圖片」的比例。
// 當圖片長寬比與 Canvas 不一致時（例如：橫向圖片在直向 Canvas 中），圖片只會佔據 Canvas 的中間一部分。
//
// 這時如果單純依賴 initial-coverage，裁切框會根據 Canvas 尺寸計算，導致初始框可能遠大於圖片本身。
// 加上我們實作了「邊界檢查 (Boundary Check)」，這會導致初始框因為超出圖片邊界而無法被縮小或移動（被擋住）。
//
// [解決方案]
// 此函式會在圖片載入並佈局完成後 ($ready) 觸發，它會：
// 1. 取得圖片在 Canvas 中的實際顯示位置與尺寸 (getBoundingClientRect)。
// 2. 計算出能「完整塞入圖片內」的最大 9:16 矩形。
// 3. 乘上 initialCoverage (預設 0.7) 得到最終尺寸。
// 4. 強制將裁切框更新到該尺寸並置中。
const fitSelectionToImage = () => {
  const image = cropperImageRef.value
  const selection = selectionRef.value
  if (!image || !selection) return

  const canvas = selection.parentElement as HTMLElement
  if (!canvas) return

  const imageRect = image.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()

  const result = calculateFitSelection(
    imageRect,
    canvasRect,
    props.aspectRatio,
    props.initialCoverage,
  )

  if (!result) return

  selection.$change(result.x, result.y, result.width, result.height)
}

defineExpose({
  selectionRef,
  toCanvas,
})

watch(
  () => props.imageUrl,
  async () => {
    if (!props.imageUrl) return

    // 開啟允許縮放的時間窗口（讓 contain 自動縮放可以執行）
    // 計時會在第一次觸發 handleImageTransform 時開始
    allowScaleTransform.value = true

    await nextTick()

    const image = cropperImageRef.value
    if (image) {
      try {
        await image.$ready()

        // 保險起見，等待一個 tick 讓 Cropper 內部完成初始的 layout/transform (contain)
        // 避免 allowScaleTransform 過早關閉導致初始置中被攔截
        await nextTick()
        allowScaleTransform.value = false

        // 圖片載入完成，立即執行一次裁切框調整
        fitSelectionToImage()
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error('Failed to load image:', err)
        emit('load-error', err)
      }
    }
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
      <cropper-canvas background scale-step="0.02">
        <cropper-image
          ref="cropperImageRef"
          :src="imageUrl"
          alt="Source Image"
          initial-center-size="contain"
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
      <div class="upload-hint">{{ uploadHint }}</div>
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
  touch-action: none;
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
