<script setup lang="ts">
import MovableBackgroundImageContainer from '@/components/MovableBackgroundImageContainer.vue'

const handleUpload = (file: File) => {
  console.log('上傳檔案：', file)
}

const handleDownload = (blob: Blob) => {
  console.log('下載 Blob：', blob)
}
</script>

<template>
  <div class="view-container">
    <h2>單純裁切模式 (可移動背景)</h2>
    <MovableBackgroundImageContainer
      :show-preview="false"
      :initial-coverage="0.5"
      :max-file-size="10 * 1024 * 1024"
      :aspect-ratio="9 / 16"
      @upload="handleUpload"
      @download="handleDownload"
    />
  </div>
</template>

<style scoped>
.view-container {
  padding: 20px;
}
h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #374151;
}
</style>
