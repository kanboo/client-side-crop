import { ref } from 'vue'

const ACCEPTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  // 注意：雖然允許驗證通過 HEIC/HEIF 格式，但大多數瀏覽器原生不支援直接顯示。
  // 若需在瀏覽器預覽，建議使用轉檔套件（如 heic2any）進行轉換。
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
  const cropData = ref<CropData>({ x: 0, y: 0, width: 0, height: 0 })

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

  const updateCropData = (data: CropData) => {
    cropData.value = data
  }

  const clear = () => {
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value)
    }
    imageUrl.value = ''
    imageName.value = ''
    imageMimeType.value = ''
    cropData.value = { x: 0, y: 0, width: 0, height: 0 }
  }

  return {
    ACCEPT_STRING,
    imageUrl,
    imageName,
    imageMimeType,
    cropData,
    loadImage,
    updateCropData,
    clear,
  }
}
