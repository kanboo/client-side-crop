# AGENTS.md - Client-Side Crop 專案開發指引

本文件為 AI coding agents 提供此專案的開發規範與最佳實踐。

## 專案概述

**專案類型**: Vue 3 單頁式圖片裁切工具  
**技術堆疊**: Vue 3.5 + TypeScript 5.9 + Vite 7 + Cropper.js v2  
**Node 版本**: ^20.19.0 || >=22.12.0

## 建置與開發指令

### 基本指令

```bash
# 開發伺服器 (hot-reload)
npm run dev

# 型別檢查 + 建置
npm run build

# 僅建置 (不檢查型別)
npm run build-only

# 型別檢查 (不建置)
npm run type-check

# 預覽建置結果
npm run preview

# Lint 並自動修正
npm run lint

# 格式化程式碼
npm run format
```

### 測試相關

**目前狀態**: 專案尚未設定測試框架  
**預留結構**: `src/**/__tests__/*` 已在 tsconfig 中排除,未來可放置測試檔案

### 驗證流程

1. **型別檢查**: `npm run type-check` (使用 vue-tsc)
2. **Lint 檢查**: `npm run lint` (ESLint + Vue/TypeScript rules)
3. **格式檢查**: `npm run format` (Prettier)

## 程式碼風格規範

### 匯入 (Imports)

**強制使用路徑別名**:

```typescript
// ✅ 正確: 使用 @ 別名
import ImageCropper from '@/components/ImageCropper.vue'
import { useCropper } from '@/composables/useCropper'
import type { CropData } from '@/types/cropper'

// ❌ 錯誤: 不使用相對路徑
import ImageCropper from '../components/ImageCropper.vue'
```

**匯入順序** (推薦):

1. Vue/第三方套件
2. 本地 composables/utilities
3. 本地元件
4. 型別定義 (使用 `import type`)

### 函式宣告

**統一使用箭頭函式**:

```typescript
// ✅ 正確: 箭頭函式
const handleFileSelect = (event: Event) => {
  // ...
}

const validateFile = (file: File): ValidationResult => {
  // ...
}

// ❌ 錯誤: 傳統函式宣告
function handleFileSelect(event: Event) {
  // ...
}
```

**例外**: Composables 匯出函式可使用箭頭或傳統宣告,但內部邏輯統一使用箭頭函式。

### TypeScript 規範

**型別定義**:

```typescript
// ✅ 正確: Interface 用於物件結構
interface Props {
  initialCoverage?: number
  maxFileSize?: number
}

interface ValidationResult {
  valid: boolean
  error?: string
}

// ✅ 正確: Type 用於聯合型別或複雜型別
type MimeType = 'image/jpeg' | 'image/png' | 'image/webp'
```

**不要明確定義函式回傳型別** (讓 TypeScript 自動推導):

```typescript
// ✅ 正確: 讓 TypeScript 推導
const useCropper = (maxFileSize: number = 10 * 1024 * 1024) => {
  return {
    imageUrl,
    loadImage,
    clear,
  }
}

// ❌ 錯誤: 明確定義回傳型別 (除非必要)
const useCropper = (maxFileSize: number): UseCropperReturn => {
  // ...
}
```

**Type Guards 優於型別斷言**:

```typescript
// ✅ 正確: 使用型別守衛
if (file.type as (typeof ACCEPTED_FORMATS)[number]) {
  // ...
}

// ❌ 絕對禁止
const data = someValue as any
const result = unknownData as unknown as MyType
```

**嚴禁使用**:

- `as any`
- `as unknown`
- `@ts-ignore`
- `@ts-expect-error`

### 命名規範

| 類型        | 規範                   | 範例                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 變數/函式   | camelCase              | `imageUrl`, `handleUpload`              |
| 元件檔案    | PascalCase             | `ImageCropper.vue`, `CropperEditor.vue` |
| View 檔案   | PascalCase + View 後綴 | `CropOnlyView.vue`                      |
| Composables | use + PascalCase       | `useCropper.ts`                         |
| 型別/介面   | PascalCase             | `CropData`, `ValidationResult`          |
| 常數        | UPPER_SNAKE_CASE       | `ACCEPTED_FORMATS`, `ACCEPT_STRING`     |

### Vue 元件規範

**統一使用 Composition API + `<script setup>`**:

```vue
<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import type { CropData } from '@/composables/useCropper'

interface Props {
  initialCoverage?: number
}

interface Emits {
  (e: 'upload', file: File): void
}

const props = withDefaults(defineProps<Props>(), {
  initialCoverage: 0.7,
})

const emit = defineEmits<Emits>()
</script>
```

**Props 定義規範**:

- 使用 TypeScript interface 定義
- 使用 `withDefaults` 提供預設值
- 避免在 template 中直接解構 props

**Emits 定義規範**:

- 使用 TypeScript function signature 定義
- 明確標註參數型別

### 錯誤處理

**採用功能性回傳 (Functional Return) 而非拋出異常**:

```typescript
// ✅ 正確: 回傳包含狀態的物件
interface ValidationResult {
  valid: boolean
  error?: string
}

const validateFile = (file: File): ValidationResult => {
  if (!ACCEPTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: '不支援的圖片格式',
    }
  }
  return { valid: true }
}

// 呼叫端處理
const result = loadImage(file)
if (!result.valid) {
  errorMessage.value = result.error || '載入失敗'
}

// ❌ 錯誤: 不使用 throw
const validateFile = (file: File) => {
  if (!valid) {
    throw new Error('Invalid file')
  }
}
```

**UI 錯誤顯示**:

- 使用響應式變數 `errorMessage` 儲存錯誤訊息
- 在 template 中條件渲染錯誤 banner

### 格式化設定 (Prettier)

```json
{
  "semi": false, // 不使用分號
  "singleQuote": true, // 使用單引號
  "printWidth": 100 // 每行最多 100 字元
}
```

### ESLint 設定

- **基礎**: Vue 3 Essential + TypeScript Recommended
- **自動修正**: 執行 `npm run lint` 會自動修正可修正的問題
- **忽略目錄**: `dist/`, `dist-ssr/`, `coverage/`

## 專案結構與慣例

```
src/
├── components/     # 可重用 UI 元件
│   ├── ImageCropper.vue      # 主容器元件
│   ├── CropperEditor.vue     # 裁切編輯器
│   └── CropperPreview.vue    # 預覽元件
├── composables/    # 共用邏輯 (Composition Functions)
│   └── useCropper.ts         # 裁切邏輯封裝
├── views/          # 頁面元件 (由 Router 載入)
│   ├── CropOnlyView.vue
│   └── CropWithPreviewView.vue
├── router/         # Vue Router 設定
│   └── index.ts
├── types/          # TypeScript 型別定義
│   └── cropper.d.ts          # Cropper.js 模組宣告
└── main.ts         # 應用程式進入點
```

### 檔案組織原則

- **元件**: 單一職責,可重用性高
- **Composables**: 封裝可重用的狀態與邏輯
- **Views**: 頁面級元件,組合多個 components
- **Types**: 集中管理型別定義,避免重複宣告

## 特定技術細節

### Cropper.js v2 整合

**重要設定** (vite.config.ts):

```typescript
vue({
  template: {
    compilerOptions: {
      // 將 cropper- 開頭的標籤視為自定義元素
      isCustomElement: (tag) => tag.startsWith('cropper-'),
    },
  },
})
```

**型別定義**: 已在 `src/types/cropper.d.ts` 中宣告模組型別,避免 TypeScript 錯誤。

### 響應式資料管理

**使用 Composables 模式**:

- 將狀態與邏輯封裝在 `useCropper.ts`
- 元件透過解構取得需要的狀態與方法
- 遵循單一資料來源原則

## Git 政策

**嚴禁自動提交**:

- Agent **禁止**主動執行 `git commit`
- **必須先向使用者確認**並獲得明確授權後才能提交

## 開發注意事項

### 新增功能時

1. 優先檢查是否可在現有 composables 擴充
2. 保持元件的單一職責
3. 遵循現有的錯誤處理模式 (ValidationResult)
4. 使用路徑別名 `@/` 進行匯入

### 修改現有程式碼時

1. 執行 `npm run type-check` 確保無型別錯誤
2. 執行 `npm run lint` 檢查程式碼風格
3. 執行 `npm run format` 格式化程式碼
4. 確保建置成功: `npm run build`

### 效能考量

- 使用 `URL.createObjectURL` 處理圖片預覽 (已實作)
- 記得在 `onUnmounted` 中清理資源 (`URL.revokeObjectURL`)
- 大檔案處理需考慮限制 (預設 10MB)

## 常見問題與解決方案

### HEIC/HEIF 格式支援

- 目前僅允許檔案選取與驗證
- 桌面瀏覽器原生**不支援**直接預覽
- 若需支援,建議引入 `heic2any` 套件進行轉檔

### 型別檢查失敗

- 確認 `cropper.d.ts` 中的模組宣告是否完整
- 檢查是否使用了 `as any` 等不安全的型別斷言

### Vite 建置問題

- 確認 Node 版本符合要求 (^20.19.0 || >=22.12.0)
- 清除快取: 刪除 `node_modules/.vite` 後重試

---

**最後更新**: 2026-01-22  
**適用版本**: client-side-crop v0.0.0
