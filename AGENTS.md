# AGENTS.md - Client-Side Crop 專案開發指引

本文件為 AI coding agents 提供此專案的開發規範與最佳實踐。

## ⚠️ Agent 行為準則 (Behavioral Guidelines)

### 1. 意圖判斷 (Intent Gate)

- **Skill 優先**: 在執行任何動作前，先檢查是否符合現有 Skill (如 `/playwright` 用於瀏覽器操作)。
- **GitHub 整合**: 若被指派 "look into X and create PR"，代表需要完成完整的工作循環 (調查 -> 實作 -> 驗證 -> PR)。
- **分類任務**:
  - **視覺/UI 調整**: (CSS, Layout, Animation) -> **必須委派** 給 `frontend-ui-ux-engineer`。
  - **邏輯實作**: (API, State, Business Logic) -> **自行處理**。
  - **混合任務**: 分拆處理，邏輯自己寫，UI 委派出去。

### 2. 任務管理 (Task Management)

- **多步驟任務**: 必須先建立 **Todo List** (`todowrite`)。
- **狀態追蹤**: 確實標記 `in_progress` 與 `completed`。
- **單一執行**: 一次只進行一個 Todo 項目。

### 3. 驗證與除錯

- **LSP 檢查**: 修改程式碼後，**必須** 執行 `lsp_diagnostics` 確保無語法錯誤。
- **型別檢查**: 每次修改後執行 `npm run type-check`。
- **Lint 檢查**: 執行 `npm run lint` 自動修正格式問題。

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
**預留結構**: `src/**/__tests__/*` 已在 tsconfig 中排除

## 程式碼風格規範

### ESLint 配置

- **版本**: ESLint 9.x (Flat Config)
- **規則集**: Vue Essential + TypeScript Recommended
- **自動修正**: `npm run lint` (包含 `--fix` 與 `--cache`)
- **Prettier 整合**: 已配置 `skip-formatting` 避免規則衝突

### 匯入 (Imports)

**強制使用路徑別名**:

```typescript
// ✅ 正確: 使用 @ 別名
import MovableCroppingEditor from '@/components/MovableCroppingEditor.vue'
import { useCropper } from '@/composables/useCropper'

// ❌ 錯誤: 不使用相對路徑
import MovableCroppingEditor from '../components/MovableCroppingEditor.vue'
```

**匯入順序** (推薦):

1. Vue/第三方套件 (`vue`, `cropperjs` 等)
2. 本地 composables/utilities (`@/composables/*`)
3. 本地元件 (`@/components/*`)
4. 型別定義 (使用 `import type` 分離型別匯入)

### 函式宣告

**統一使用箭頭函式**:

```typescript
// ✅ 正確: 箭頭函式
const handleFileSelect = (event: Event) => {
  /* ... */
}

// ❌ 錯誤: 傳統函式宣告
function handleFileSelect(event: Event) {
  /* ... */
}
```

### TypeScript 規範

**型別定義**:

- Interface 用於物件結構 (`interface Props { ... }`)
- **不要明確定義函式回傳型別**，讓 TS 自動推導 (除非必要)。
- **Type Guards** 優於型別斷言。
- **嚴禁使用**: `as any`, `@ts-ignore`。

### 命名規範

| 類型        | 規範                   | 範例                          |
| :---------- | :--------------------- | :---------------------------- |
| 變數/函式   | camelCase              | `imageUrl`, `handleUpload`    |
| 元件檔案    | PascalCase             | `MovableCroppingEditor.vue`   |
| View 檔案   | PascalCase + View 後綴 | `MovableCroppingOnlyView.vue` |
| Composables | use + PascalCase       | `useCropper.ts`               |
| 常數        | UPPER_SNAKE_CASE       | `ACCEPTED_FORMATS`            |

### Vue 元件規範

**統一使用 Composition API + `<script setup>`**:

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  initialCoverage?: number
}
const props = withDefaults(defineProps<Props>(), {
  initialCoverage: 0.7,
})
</script>
```

### 錯誤處理

**採用功能性回傳 (Functional Return)**:
不要拋出異常 (throw)，而是回傳包含狀態的物件：

```typescript
// ✅ 正確: 回傳結果物件
interface ValidationResult {
  valid: boolean
  error?: string
}

const validateFile = (file: File) => {
  if (!ACCEPTED_FORMATS.includes(file.type)) {
    return { valid: false, error: '不支援的圖片格式' }
  }
  if (file.size > maxFileSize) {
    return { valid: false, error: '圖片大小超過限制' }
  }
  return { valid: true }
}

// 使用方式
const result = validateFile(file)
if (!result.valid) {
  errorMessage.value = result.error || '發生錯誤'
  return
}

// ❌ 錯誤: 拋出異常
const validateFile = (file: File) => {
  if (!ACCEPTED_FORMATS.includes(file.type)) {
    throw new Error('不支援的圖片格式')
  }
}
```

### 格式化設定 (Prettier)

- 無分號 (`semi: false`)
- 單引號 (`singleQuote: true`)
- 行寬 100 (`printWidth: 100`)

## 專案結構與慣例

```
src/
├── components/     # 可重用 UI 元件
│   ├── MovableBackgroundImageContainer.vue
│   ├── MovableBackgroundImageEditor.vue
│   ├── MovableCroppingContainer.vue
│   ├── MovableCroppingEditor.vue
│   └── CropperResultPreview.vue
├── composables/    # 共用邏輯
│   └── useCropper.ts
├── views/          # 頁面元件
│   ├── MovableBackgroundImageOnlyView.vue
│   ├── MovableBackgroundImageWithPreviewView.vue
│   ├── MovableCroppingOnlyView.vue
│   └── MovableCroppingWithPreviewView.vue
├── types/          # TypeScript 型別定義
└── main.ts         # 進入點
```

## 特定技術細節

### Cropper.js v2 整合

- Vite 設定中已啟用 `isCustomElement` 支援 `cropper-` 標籤。
- 型別定義於 `src/types/cropper.d.ts`。

## Git 政策

- **嚴禁自動提交**: Agent **禁止**主動執行 `git commit`。
- **必須詢問**: 必須先向使用者確認並獲得明確授權後才能提交。

---

**最後更新**: 2026-01-24
