<script setup lang="ts">
import 'cropperjs'

interface Props {
  imageUrl?: string
  aspectRatio?: number
  selectionSelector?: string
}

withDefaults(defineProps<Props>(), {
  aspectRatio: 9 / 16,
  selectionSelector: '#cropper-selection-main',
})
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
