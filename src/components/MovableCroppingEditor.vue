<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import 'cropperjs'
import type { CropperSelection, CropperImage } from 'cropperjs'
import { calculateFitSelection } from '@/composables/useCropperCalculation'
import { useHeicSupport } from '@/composables/useHeicSupport'

interface Props {
  imageUrl: string
  initialCoverage: number
  aspectRatio: number
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

const containerRef = ref<HTMLElement | null>(null)
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

defineExpose({
  selectionRef,
  toCanvas,
})

// 標記是否允許縮放變換（上傳圖片後短時間內允許）
const allowScaleTransform = ref(false)

// 處理圖片變換事件
// Workaround: Cropper.js v2 的 initial-center-size="contain" 依賴 translatable 與 scalable 屬性
// 若直接將該屬性設為 false，圖片將無法自動置中與縮放。
// 因此我們在上傳圖片後的短暫時間內允許變換 (allowScaleTransform = true)，
// 待 initial layout 完成後，再透過此事件處理器攔截後續的使用者操作 (allowScaleTransform = false)。
const handleImageTransform = (event: Event) => {
  // 如果在允許期間，直接通過
  if (allowScaleTransform.value) {
    return
  }

  // 禁止一切對圖片的變換
  event.preventDefault()
}

// 標記是否為程式化更新 (避免被邊界檢查擋住)
const isProgrammaticUpdate = ref(false)

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
// 5. 過程中暫時繞過邊界檢查 (isProgrammaticUpdate)，確保更新成功。
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

  isProgrammaticUpdate.value = true
  selection.$change(result.x, result.y, result.width, result.height)

  nextTick(() => {
    isProgrammaticUpdate.value = false
  })
}

// 檢查選取框是否在限制範圍內
const inSelection = (
  selection: { x: number; y: number; width: number; height: number },
  maxSelection: { x: number; y: number; width: number; height: number },
) => {
  // 使用稍微寬鬆的檢查（epsilon）來避免浮點數精度問題
  const EPSILON = 0.1
  return (
    selection.x >= maxSelection.x - EPSILON &&
    selection.y >= maxSelection.y - EPSILON &&
    selection.x + selection.width <= maxSelection.x + maxSelection.width + EPSILON &&
    selection.y + selection.height <= maxSelection.y + maxSelection.height + EPSILON
  )
}

const handleSelectionChange = (event: CustomEvent) => {
  // 如果是程式化更新，直接允許
  if (isProgrammaticUpdate.value) return

  const selection = event.detail
  const image = cropperImageRef.value
  const selectionElement = selectionRef.value

  if (!image || !selectionElement) return

  // 取得 Canvas 元素 (selection 的父元素)
  const canvas = selectionElement.parentElement as HTMLElement
  if (!canvas) return

  const imageRect = image.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()

  const maxSelection = {
    x: imageRect.left - canvasRect.left,
    y: imageRect.top - canvasRect.top,
    width: imageRect.width,
    height: imageRect.height,
  }

  if (!inSelection(selection, maxSelection)) {
    event.preventDefault()
  }
}

// 覆寫 cropper-handle 的樣式
//
// [為什麼需要這個函式？]
// `cropper-handle` 是一個 Web Component (Custom Element)，使用了 Shadow DOM 技術封裝樣式。
// 這導致外部 CSS (即使不加 scoped) 無法穿透影響其內部結構，且該套件將控制點大小寫死 (width: 5px) 在內部樣式中。
//
// [解決方案]
// 透過 JavaScript 取得該元件的 `shadowRoot`，直接注入新的 `<style>` 規則來覆寫內部樣式。
// 這相當於在它的 Shadow DOM 內部貼了一張新壁紙，強制將控制點大小改為 8px，提升移動裝置上的操作體驗。
//
// [防止重複注入]
// 使用 `data-custom-handle-style` 屬性標記已注入的 style 標籤，避免重複注入導致 DOM 污染。
const overrideHandleStyles = () => {
  if (!containerRef.value) return

  const handles = containerRef.value.querySelectorAll('cropper-handle')
  handles.forEach((handle) => {
    if (handle.shadowRoot) {
      if (handle.shadowRoot.querySelector('style[data-custom-handle-style]')) return

      const style = document.createElement('style')
      style.setAttribute('data-custom-handle-style', 'true')
      style.textContent = `
        :host([action$="-resize"])::after {
          width: 8px !important;
          height: 8px !important;
        }
      `
      handle.shadowRoot.appendChild(style)
    }
  })
}

watch(
  () => props.imageUrl,
  async () => {
    if (!props.imageUrl) return

    // 開啟允許縮放的時間窗口（讓 contain 自動縮放可以執行）
    // 計時會在第一次觸發 handleImageTransform 時開始
    allowScaleTransform.value = true

    await nextTick()

    // 注入樣式
    overrideHandleStyles()

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
  { immediate: true },
)
</script>

<template>
  <div
    ref="containerRef"
    class="cropper-editor"
    :class="{ 'is-empty': !imageUrl }"
    @click="!imageUrl && $emit('trigger-file-input')"
  >
    <template v-if="imageUrl">
      <cropper-canvas background scale-step="0.05">
        <cropper-image
          ref="cropperImageRef"
          :src="imageUrl"
          alt="Source Image"
          initial-center-size="contain"
          scalable
          translatable
          @transform="handleImageTransform"
        ></cropper-image>
        <cropper-handle />
        <cropper-selection
          :id="selectionId"
          ref="selectionRef"
          :initial-coverage="initialCoverage"
          :aspect-ratio="aspectRatio"
          movable
          resizable
          zoomable
          @change="handleSelectionChange"
        >
          <cropper-grid bordered covered rows="1" columns="1" theme-color="#000000"></cropper-grid>
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
