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

// 邊界回彈 (Snap Back) 邏輯
const snapToBoundary = () => {
  const selection = selectionRef.value
  const image = cropperImageRef.value
  if (!selection || !image) return

  const selectionRect = selection.getBoundingClientRect()
  const imageRect = image.getBoundingClientRect()

  const matrix = image.$getTransform()
  // 複製一份 matrix 以便修改
  const newMatrix = [...matrix] as [number, number, number, number, number, number]
  let changed = false

  // 1. 檢查縮放 (Scale)
  // 如果圖片比選取框小，計算需要的縮放比例
  const widthRatio = selectionRect.width / imageRect.width
  const heightRatio = selectionRect.height / imageRect.height
  const maxRatio = Math.max(widthRatio, heightRatio)

  // 預估新的 Rect 資訊 (用於後續的位移計算)
  let currentLeft = imageRect.left
  let currentTop = imageRect.top
  let currentWidth = imageRect.width
  let currentHeight = imageRect.height

  // 如果需要放大 (給予 1% 的容許值)
  if (maxRatio > 1.01) {
    // 應用縮放
    newMatrix[0] *= maxRatio
    newMatrix[1] *= maxRatio
    newMatrix[2] *= maxRatio
    newMatrix[3] *= maxRatio

    // Note: 若 CSS transform-origin 為 center (預設值)，
    // 單純縮放 matrix 的 scale components (a, d) 就會達到「以中心縮放」的視覺效果。
    // 因此這裡不需要像之前一樣手動修正 translate (tx, ty)。
    // 之前的錯誤邏輯會導致縮放時位置偏移。

    // 更新 Rect 資訊以供後續位移計算使用
    // 假設是以中心縮放，計算新的邊界
    const cx = currentLeft + currentWidth / 2
    const cy = currentTop + currentHeight / 2

    currentWidth *= maxRatio
    currentHeight *= maxRatio
    currentLeft = cx - currentWidth / 2
    currentTop = cy - currentHeight / 2

    changed = true
  }

  // 2. 檢查位移 (Translation)
  // 計算是否與選取框有間隙 (Gap)
  let dx = 0
  let dy = 0

  // 取得父容器的 Global Scale Factor
  // imageRect.width (Viewport) = image.offsetWidth * newMatrix[0] (Local Scale) * ParentScale
  // 但 image.offsetWidth 可能是 0 (若未正確 render)，所以改用 canvas 比較
  // ParentScale = canvasRect.width / canvas.offsetWidth
  const canvas = image.parentElement as HTMLElement
  let globalScale = 1
  if (canvas && canvas.offsetWidth > 0) {
    const canvasRect = canvas.getBoundingClientRect()
    globalScale = canvasRect.width / canvas.offsetWidth
  }

  // 檢查水平方向
  if (currentLeft > selectionRect.left) {
    // 左邊有空隙，向左移
    dx = selectionRect.left - currentLeft
  } else if (currentLeft + currentWidth < selectionRect.right) {
    // 右邊有空隙，向右移
    dx = selectionRect.right - (currentLeft + currentWidth)
  }

  // 檢查垂直方向
  if (currentTop > selectionRect.top) {
    // 上邊有空隙，向上移
    dy = selectionRect.top - currentTop
  } else if (currentTop + currentHeight < selectionRect.bottom) {
    // 下邊有空隙，向下移
    dy = selectionRect.bottom - (currentTop + currentHeight)
  }

  if (dx !== 0 || dy !== 0) {
    // 修正: 加上 globalScale 除法
    // dx 是 Viewport Pixel，需要轉換回 Local Matrix Unit
    // Local Unit = Viewport Pixel / Global Scale
    if (globalScale > 0) {
      newMatrix[4] += dx / globalScale
      newMatrix[5] += dy / globalScale
      changed = true
    }
  }

  if (changed) {
    // 套用 CSS Transition 實現回彈效果
    image.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
    image.$setTransform(newMatrix)

    const cleanup = () => {
      image.style.transition = ''
      image.removeEventListener('transitionend', cleanup)
    }
    image.addEventListener('transitionend', cleanup)
    // Fallback: 如果 transitionend 沒觸發 (例如元素被隱藏)，350ms 後清除
    setTimeout(cleanup, 350)
  }
}

// 追蹤目前的指標位置與數量
const activePointers = new Map<number, { x: number; y: number }>()
let prevTwoFingerCenter: { x: number; y: number } | null = null

const getTwoFingerCenter = () => {
  if (activePointers.size !== 2) return null
  const points = Array.from(activePointers.values())
  const p1 = points[0]
  const p2 = points[1]

  if (!p1 || !p2) return null

  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  }
}

const onPointerMove = (event: PointerEvent) => {
  if (activePointers.has(event.pointerId)) {
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (activePointers.size === 2) {
      const currentCenter = getTwoFingerCenter()
      if (currentCenter && prevTwoFingerCenter) {
        const dx = currentCenter.x - prevTwoFingerCenter.x
        const dy = currentCenter.y - prevTwoFingerCenter.y

        // 取得 globalScale
        let globalScale = 1
        const image = cropperImageRef.value
        if (image && image.parentElement) {
          const canvas = image.parentElement as HTMLElement
          if (canvas.offsetWidth > 0) {
            const canvasRect = canvas.getBoundingClientRect()
            globalScale = canvasRect.width / canvas.offsetWidth
          }

          if (globalScale > 0) {
            image.$move(dx / globalScale, dy / globalScale)
          }
        }
      }
      prevTwoFingerCenter = currentCenter
    } else {
      prevTwoFingerCenter = null
    }
  }
}

const onPointerUp = (event: PointerEvent) => {
  activePointers.delete(event.pointerId)

  if (activePointers.size < 2) {
    prevTwoFingerCenter = null
  }

  if (activePointers.size === 0) {
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    window.removeEventListener('pointermove', onPointerMove)
    snapToBoundary()
  }
}

const onPointerDown = (event: PointerEvent) => {
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (activePointers.size === 2) {
    prevTwoFingerCenter = getTwoFingerCenter()
  } else {
    prevTwoFingerCenter = null
  }

  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)
}

let wheelTimeout: ReturnType<typeof setTimeout>
const onWheel = () => {
  clearTimeout(wheelTimeout)
  wheelTimeout = setTimeout(snapToBoundary, 150) // 150ms debounce for wheel
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

    await nextTick()

    const image = cropperImageRef.value
    if (image) {
      try {
        await image.$ready()

        // 保險起見，等待一個 tick 讓 Cropper 內部完成初始的 layout/transform (contain)
        await nextTick()

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
      <cropper-canvas background scale-step="0.1" @pointerdown="onPointerDown" @wheel="onWheel">
        <cropper-image
          ref="cropperImageRef"
          :src="imageUrl"
          alt="Source Image"
          initial-center-size="contain"
          scalable
          skewable
          translatable
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
