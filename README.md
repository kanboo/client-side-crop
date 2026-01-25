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
- ✅ **智慧 HEIC 支援偵測**：自動判斷瀏覽器是否支援 HEIC 格式

## 📦 元件使用

本專案提供兩種裁切模式：

1. **MovableCroppingContainer**: 圖片固定，移動裁切框 (預設)
2. **MovableBackgroundImageContainer**: 裁切框固定，移動背景圖

### 基本使用

```vue
<template>
  <MovableCroppingContainer
    :initial-coverage="0.7"
    :max-file-size="10 * 1024 * 1024"
    :aspect-ratio="9 / 16"
    :show-preview="true"
    @upload="handleUpload"
    @download="handleDownload"
  />
</template>

<script setup lang="ts">
import MovableCroppingContainer from '@/components/MovableCroppingContainer.vue'

const handleUpload = (file: File) => {
  console.log('上傳檔案：', file)
}

const handleDownload = (blob: Blob) => {
  console.log('下載 Blob：', blob)
}
</script>
```

### Props

| 屬性              | 類型      | 預設值     | 說明                            |
| ----------------- | --------- | ---------- | ------------------------------- |
| `initialCoverage` | `number`  | `0.7`      | 裁切框初始覆蓋比例 (0~1)        |
| `maxFileSize`     | `number`  | `10485760` | 最大檔案大小 (bytes)，預設 10MB |
| `aspectRatio`     | `number`  | `0.5625`   | 裁切比例，預設 9/16             |
| `showPreview`     | `boolean` | `true`     | 是否顯示即時預覽                |

### Events

| 事件名     | 參數           | 說明               |
| ---------- | -------------- | ------------------ |
| `upload`   | `(file: File)` | 點擊上傳按鈕時觸發 |
| `download` | `(blob: Blob)` | 點擊下載按鈕時觸發 |

## 🎨 支援的圖片格式

所有主流瀏覽器都支援的格式：

- **JPEG** (`.jpg`, `.jpeg`)
- **PNG** (`.png`)
- **GIF** (`.gif`)
- **WebP** (`.webp`)
- **BMP** (`.bmp`)
- **AVIF** (`.avif`)

### ℹ️ 關於 HEIC/HEIF 支援

本工具內建智慧偵測機制 (`useHeicSupport`)，會根據使用者的瀏覽器環境自動決定是否開放 HEIC 格式：

- **Safari (macOS/iOS)**：✅ **原生支援**，允許選擇與裁切 HEIC 圖片。
- **Chrome / Edge / Firefox**：❌ **不支援**，系統會自動將 HEIC 從允許格式列表中移除，避免使用者上傳後看到空白畫面。

您無需手動設定，系統會自動處理相容性問題。

## 📂 專案結構

```
src/
├── components/
│   ├── MovableCroppingContainer.vue        # 裁切模式 1 (移動框) 容器
│   ├── MovableBackgroundImageContainer.vue # 裁切模式 2 (移動圖) 容器
│   ├── MovableCroppingEditor.vue           # 裁切模式 1 編輯器核心
│   ├── MovableBackgroundImageEditor.vue    # 裁切模式 2 編輯器核心
│   └── CropperResultPreview.vue            # 即時預覽元件
├── composables/
│   ├── useCropper.ts         # Cropper 邏輯封裝
│   └── useHeicSupport.ts     # HEIC 支援度檢測邏輯
├── types/
│   └── cropper.d.ts          # TypeScript 型別定義
└── App.vue                   # 使用範例
```

## 🔧 調整裁切框初始大小

有兩種方式調整：

### 方法 1：透過 Props（推薦）

```vue
<MovableCroppingContainer :initial-coverage="0.5" />
<!-- 50% 覆蓋 -->
<MovableCroppingContainer :initial-coverage="0.8" />
<!-- 80% 覆蓋 -->
```

### 方法 2：修改元件預設值

編輯 `src/components/MovableCroppingContainer.vue`：

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
- **裁切套件**：[Cropper.js v2.1.0](https://github.com/fengyuanchen/cropperjs) (MIT License)
- **程式碼規範**：ESLint + Prettier

## 📄 授權與套件使用

### Cropper.js 授權

本專案使用 [Cropper.js](https://github.com/fengyuanchen/cropperjs) 作為核心裁切引擎。

- **授權類型**：MIT License
- **作者**：[Fengyuan Chen](https://github.com/fengyuanchen)
- **版本**：v2.1.0
- **授權內容**：MIT License 允許商業使用、修改、散佈和私人使用，唯一要求是保留原始授權聲明

### 相關資源

- [Cropper.js GitHub Repository](https://github.com/fengyuanchen/cropperjs)
- [Cropper.js 官方文檔](https://github.com/fengyuanchen/cropperjs/blob/main/README.md)
- [MIT License 完整內容](https://github.com/fengyuanchen/cropperjs/blob/main/LICENSE)

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
