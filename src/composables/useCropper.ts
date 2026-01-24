import { ref, onScopeDispose } from 'vue'

/**
 * 支援的圖片格式列表 (MIME types)
 * @constant
 */
const ACCEPTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  // ⚠️ HEIC/HEIF 格式限制說明:
  // 1. 瀏覽器原生支援情況:
  //    - Chrome/Edge/Firefox (桌面版): ❌ 不支援 (無法直接預覽 HEIC 圖片)
  //    - Safari (macOS/iOS): ✅ 支援
  // 2. 目前實作:
  //    - 允許檔案選擇 (驗證會通過)
  //    - 但 Chrome/Edge/Firefox 使用者會看到空白預覽區 (因為 <cropper-image> 無法載入)
  // 3. 解決方案選項:
  //    Option A: 移除 HEIC/HEIF (建議用於大多數使用者)
  //    Option B: 整合 heic2any (https://github.com/alexcorvi/heic2any) 進行客戶端轉換
  //    Option C: 後端 API 轉換 (需要額外開發)
  // 4. 當前決策: 保留格式驗證,但使用者體驗在非 Safari 瀏覽器會有問題
  'image/heic',
  'image/heif',
  'image/avif',
] as const

/**
 * 檔案上傳 accept 屬性字串
 * @constant
 * @example <input type="file" :accept="ACCEPT_STRING" />
 */
const ACCEPT_STRING = '.jpg,.jpeg,.png,.gif,.webp,.bmp,.heic,.heif,.avif'

/**
 * Cropper.js 裁切區域資料結構
 */
export interface CropData {
  /** X 軸偏移量 (像素) */
  x: number
  /** Y 軸偏移量 (像素) */
  y: number
  /** 裁切寬度 (像素) */
  width: number
  /** 裁切高度 (像素) */
  height: number
}

/**
 * 檔案驗證結果
 */
interface ValidationResult {
  /** 驗證是否通過 */
  valid: boolean
  /** 錯誤訊息 (驗證失敗時提供) */
  error?: string
}

/**
 * 圖片裁切邏輯封裝 Composable
 *
 * @description 提供圖片選擇、驗證、載入與清理功能
 *
 * @param {number} [maxFileSize=10485760] - 最大檔案大小限制 (bytes)，預設 10MB
 *
 * @returns {Object} Cropper 功能集合
 * @returns {string} ACCEPT_STRING - 檔案選擇器 accept 屬性
 * @returns {Ref<string>} imageUrl - 圖片 Object URL (透過 URL.createObjectURL 產生)
 * @returns {Ref<string>} imageName - 圖片檔案名稱
 * @returns {Ref<string>} imageMimeType - 圖片 MIME type
 * @returns {Function} loadImage - 載入並驗證圖片檔案
 * @returns {Function} clear - 清除圖片並釋放 Object URL
 *
 * @example
 * const {
 *   ACCEPT_STRING,
 *   imageUrl,
 *   imageName,
 *   loadImage,
 *   clear
 * } = useCropper(5 * 1024 * 1024) // 5MB 限制
 *
 * const handleFileChange = (event: Event) => {
 *   const file = (event.target as HTMLInputElement).files?.[0]
 *   if (!file) return
 *
 *   const result = loadImage(file)
 *   if (!result.valid) {
 *     alert(result.error)
 *   }
 * }
 */
export const useCropper = (maxFileSize: number = 10 * 1024 * 1024) => {
  const imageUrl = ref<string>('')
  const imageName = ref<string>('')
  const imageMimeType = ref<string>('')

  /**
   * 驗證圖片檔案格式與大小
   * @param {File} file - 要驗證的檔案
   * @returns {ValidationResult} 驗證結果
   */
  const validateFile = (file: File): ValidationResult => {
    if (!ACCEPTED_FORMATS.includes(file.type as (typeof ACCEPTED_FORMATS)[number])) {
      return {
        valid: false,
        error: '不支援的圖片格式，請選擇 JPG、PNG、GIF、WebP、BMP、HEIC 或 AVIF',
      }
    }

    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `圖片大小超過 ${(maxFileSize / 1024 / 1024).toFixed(0)}MB 限制`,
      }
    }

    return { valid: true }
  }

  /**
   * 載入圖片檔案並建立 Object URL
   * @param {File} file - 要載入的圖片檔案
   * @returns {ValidationResult} 載入結果 (失敗時包含錯誤訊息)
   *
   * @description
   * - 自動驗證檔案格式與大小
   * - 自動釋放先前的 Object URL (避免記憶體洩漏)
   * - 設定 imageUrl、imageName、imageMimeType
   */
  const loadImage = (file: File): ValidationResult => {
    const validation = validateFile(file)
    if (!validation.valid) {
      return validation
    }

    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value)
    }

    imageUrl.value = URL.createObjectURL(file)
    imageName.value = file.name
    imageMimeType.value = file.type

    return { valid: true }
  }

  /**
   * 清除圖片資料並釋放 Object URL
   * @description 主動呼叫此函式或 component unmount 時會自動清理
   */
  const clear = () => {
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value)
    }
    imageUrl.value = ''
    imageName.value = ''
    imageMimeType.value = ''
  }

  // 當 component unmount 時自動清理 Object URL
  onScopeDispose(() => {
    clear()
  })

  return {
    ACCEPT_STRING,
    imageUrl,
    imageName,
    imageMimeType,
    loadImage,
    clear,
  }
}
