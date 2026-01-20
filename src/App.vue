<script setup lang="ts">
import ImageCropper from '@/components/ImageCropper.vue'

const handleUpload = (file: File) => {
  console.log('上傳檔案：', file)
  console.log('檔案名稱：', file.name)
  console.log('檔案大小：', (file.size / 1024).toFixed(2), 'KB')
  console.log('檔案類型：', file.type)
}

const handleDownload = (blob: Blob) => {
  console.log('下載 Blob：', blob)
  console.log('Blob 大小：', (blob.size / 1024).toFixed(2), 'KB')
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>圖片裁切工具</h1>
      <p>支援 9:16 比例裁切，可放大縮小，保持原格式輸出</p>
    </header>

    <main class="main">
      <ImageCropper
        :initial-coverage="0.7"
        :max-file-size="10 * 1024 * 1024"
        :aspect-ratio="9 / 16"
        @upload="handleUpload"
        @download="handleDownload"
      />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
}

.header {
  text-align: center;
  padding: 40px 20px 20px;
}

.header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px;
}

.header p {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.main {
  padding: 20px;
}
</style>
