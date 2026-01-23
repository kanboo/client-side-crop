import { ref, onScopeDispose } from 'vue'

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
const ACCEPT_STRING = '.jpg,.jpeg,.png,.gif,.webp,.bmp,.heic,.heif,.avif'

export interface CropData {
  x: number
  y: number
  width: number
  height: number
}

interface ValidationResult {
  valid: boolean
  error?: string
}

export const useCropper = (maxFileSize: number = 10 * 1024 * 1024) => {
  const imageUrl = ref<string>('')
  const imageName = ref<string>('')
  const imageMimeType = ref<string>('')

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

  const clear = () => {
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value)
    }
    imageUrl.value = ''
    imageName.value = ''
    imageMimeType.value = ''
  }

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
