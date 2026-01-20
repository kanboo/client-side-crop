import { ref, type Ref } from 'vue'
import type { CropperSelection } from 'cropperjs'

const ACCEPTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
] as const
const ACCEPT_STRING = '.jpg,.jpeg,.png,.gif,.webp,.bmp'

interface CropData {
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
  const selectionRef: Ref<CropperSelection | null> = ref(null)

  const validateFile = (file: File): ValidationResult => {
    if (!ACCEPTED_FORMATS.includes(file.type as (typeof ACCEPTED_FORMATS)[number])) {
      return {
        valid: false,
        error: '不支援的圖片格式，請選擇 JPG、PNG、GIF、WebP 或 BMP',
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

  const getCroppedBlob = async (): Promise<Blob | null> => {
    if (!selectionRef.value) return null

    try {
      const canvas = await selectionRef.value.$toCanvas()
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), imageMimeType.value || 'image/png')
      })
    } catch (error) {
      console.error('Failed to generate cropped image:', error)
      return null
    }
  }

  const getCroppedFile = async (): Promise<File | null> => {
    const blob = await getCroppedBlob()
    if (!blob) return null

    const fileName = imageName.value.replace(/\.[^.]+$/, (ext) => `-cropped${ext}`)
    return new File([blob], fileName, { type: blob.type })
  }

  const reset = () => {
    selectionRef.value?.$reset()
  }

  const clear = () => {
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value)
    }
    imageUrl.value = ''
    imageName.value = ''
    imageMimeType.value = ''
    cropData.value = { x: 0, y: 0, width: 0, height: 0 }
    selectionRef.value = null
  }

  return {
    ACCEPT_STRING,
    imageUrl,
    imageName,
    imageMimeType,
    cropData,
    selectionRef,
    loadImage,
    updateCropData,
    getCroppedBlob,
    getCroppedFile,
    reset,
    clear,
  }
}
