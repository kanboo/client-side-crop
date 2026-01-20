# 圖片裁切工具 (Image Cropper)

基於 Vue 3 + TypeScript + Cropper.js v2 的圖片裁切元件，支援固定 9:16 比例裁切。

## ✨ 功能特色

- ✅ 固定 9:16 寬高比例裁切
- ✅ 裁切框可自由移動、縮放
- ✅ 即時預覽裁切結果
- ✅ 顯示裁切區域尺寸資訊
- ✅ 保持原圖片格式輸出
- ✅ 支援下載裁切後圖片
- ✅ 透過 Event 發送上傳事件
- ✅ 檔案格式驗證（JPEG、PNG、GIF、WebP、BMP、HEIC、AVIF）
- ✅ 檔案大小限制（預設 10MB）

## 📦 元件使用

### 基本使用

```vue
<template>
  <ImageCropper
    :initial-coverage="0.7"
    :max-file-size="10 * 1024 * 1024"
    :aspect-ratio="9 / 16"
    @upload="handleUpload"
    @download="handleDownload"
  />
</template>

<script setup lang="ts">
import ImageCropper from '@/components/ImageCropper.vue'

const handleUpload = (file: File) => {
  console.log('上傳檔案：', file)
}

const handleDownload = (blob: Blob) => {
  console.log('下載 Blob：', blob)
}
</script>
```

### Props

| 屬性              | 類型     | 預設值     | 說明                            |
| ----------------- | -------- | ---------- | ------------------------------- |
| `initialCoverage` | `number` | `0.7`      | 裁切框初始覆蓋比例 (0~1)        |
| `maxFileSize`     | `number` | `10485760` | 最大檔案大小 (bytes)，預設 10MB |
| `aspectRatio`     | `number` | `0.5625`   | 裁切比例，預設 9/16             |

### Events

| 事件名     | 參數           | 說明               |
| ---------- | -------------- | ------------------ |
| `upload`   | `(file: File)` | 點擊上傳按鈕時觸發 |
| `download` | `(blob: Blob)` | 點擊下載按鈕時觸發 |

## 🎨 支援的圖片格式

所有主流瀏覽器都支援的格式：

- **JPEG** (`.jpg`, `.jpeg`) - 最常見的照片格式
- **PNG** (`.png`) - 支援透明背景
- **GIF** (`.gif`) - 支援動畫（裁切後只保留第一幀）
- **WebP** (`.webp`) - Google 開發的高壓縮率格式
- **BMP** (`.bmp`) - 無壓縮點陣圖
- **HEIC/HEIF** (`.heic`, `.heif`) - iOS 標準照片格式
- **AVIF** (`.avif`) - 下一代高壓縮格式

> ⚠️ **注意：關於 HEIC/HEIF 支援**
>
> 雖然本工具支援選取與驗證 HEIC/HEIF 格式，但目前的桌面瀏覽器（Chrome, Firefox, Edge）原生**不支援**直接預覽 `.heic` 圖片。
>
> 若您需要在前端直接顯示或裁切 HEIC 圖片，建議引入 [heic2any](https://github.com/alexcorvi/heic2any) 等轉檔套件，在 `loadImage` 階段將其轉為 JPEG 或 PNG。本專案目前僅實作「格式允許選取」與「基本驗證」。

## 📂 專案結構

```
src/
├── components/
│   └── ImageCropper.vue      # 主要裁切元件
├── composables/
│   └── useCropper.ts         # Cropper 邏輯封裝
├── types/
│   └── cropper.d.ts          # TypeScript 型別定義
└── App.vue                   # 使用範例
```

## 🔧 調整裁切框初始大小

有兩種方式調整：

### 方法 1：透過 Props（推薦）

```vue
<ImageCropper :initial-coverage="0.5" />
<!-- 50% 覆蓋 -->
<ImageCropper :initial-coverage="0.8" />
<!-- 80% 覆蓋 -->
```

### 方法 2：修改元件預設值

編輯 `src/components/ImageCropper.vue`：

```typescript
const props = withDefaults(defineProps<Props>(), {
  initialCoverage: 0.7, // 修改這裡
  // ...
})
```

## 🛠️ 技術架構

- **框架**：Vue 3 (Composition API + script setup)
- **語言**：TypeScript 5.9
- **建置工具**：Vite 7
- **裁切套件**：Cropper.js v2.1.0
- **程式碼規範**：ESLint + Prettier

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
