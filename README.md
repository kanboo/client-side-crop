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

- **JPEG** (`.jpg`, `.jpeg`) - 最常見的照片格式
- **PNG** (`.png`) - 支援透明背景
- **GIF** (`.gif`) - 支援動畫（裁切後只保留第一幀）
- **WebP** (`.webp`) - Google 開發的高壓縮率格式
- **BMP** (`.bmp`) - 無壓縮點陣圖
- **AVIF** (`.avif`) - 下一代高壓縮格式

### ⚠️ **HEIC/HEIF 格式限制警告**

**重要提示**：雖然本工具允許選取 HEIC/HEIF 格式 (`.heic`, `.heif`)，但存在以下已知限制：

#### 瀏覽器支援現況

| 瀏覽器              | 支援狀態      | 說明                     |
| ------------------- | ------------- | ------------------------ |
| Safari (macOS/iOS)  | ✅ 支援       | 原生支援 HEIC 預覽與裁切 |
| Chrome/Edge/Firefox | ❌ **不支援** | 無法預覽，畫面會顯示空白 |

#### 目前實作狀態

- ✅ 檔案格式驗證（允許選擇 HEIC 檔案）
- ❌ 跨瀏覽器預覽支援（僅 Safari 可用）
- ❌ 自動轉檔功能

#### 解決方案選項

**Option A: 前端轉檔（推薦用於無後端環境）**

```bash
npm install heic2any
```

在 `useCropper.ts` 的 `loadImage` 函式中整合：

```typescript
import heic2any from 'heic2any'

const loadImage = async (file: File) => {
  let processedFile = file

  if (file.type === 'image/heic' || file.type === 'image/heif') {
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    })
    processedFile = new File([converted], file.name.replace(/\.heic$/i, '.jpg'), {
      type: 'image/jpeg',
    })
  }

  // ... 原有驗證邏輯
}
```

**Option B: 後端轉檔**

- 使用 ImageMagick / libheif 進行伺服器端轉換
- 適合需要統一圖片格式的應用場景

**Option C: 移除 HEIC 支援（最簡單）**
若大部分使用者使用非 Safari 瀏覽器，可於 `useCropper.ts` 中移除 `'image/heic'` 與 `'image/heif'`。

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
│   └── useCropper.ts         # Cropper 邏輯封裝
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
