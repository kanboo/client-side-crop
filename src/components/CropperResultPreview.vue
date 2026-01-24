<script setup lang="ts">
import 'cropperjs'
import { watch } from 'vue'

/**
 * 即時預覽元件屬性
 * @property {string} [imageUrl] - 圖片 URL (來自 useCropper)
 * @property {number} [aspectRatio=9/16] - 預覽區域寬高比 (0.5625 = 9:16)
 * @property {string} [selectionSelector='#cropper-selection-main'] - Cropper.js 選取框 CSS 選擇器
 */
interface Props {
  imageUrl?: string
  aspectRatio?: number
  selectionSelector?: string
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: 9 / 16,
  selectionSelector: '#cropper-selection-main',
})

// Props 驗證：檢查 aspectRatio 是否為有效數值
watch(
  () => props.aspectRatio,
  (newRatio) => {
    if (newRatio !== undefined && (newRatio <= 0 || !Number.isFinite(newRatio))) {
      console.warn(
        `[CropperResultPreview] aspectRatio 必須為大於 0 的有限數值，當前值：${newRatio}`,
      )
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="preview-wrapper">
    <cropper-viewer v-if="imageUrl" :selection="selectionSelector"></cropper-viewer>
    <div v-else class="empty-state">
      <div class="preview-placeholder-text">預覽區域</div>
    </div>
  </div>
</template>

<style scoped>
.preview-wrapper {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: v-bind(aspectRatio);
  width: 100%;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

cropper-viewer {
  width: 100%;
  height: 100%;
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
