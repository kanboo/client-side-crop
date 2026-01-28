import { onMounted, ref } from 'vue'

const MINIMAL_HEIC_BASE64 =
  'data:image/heic;base64,AAAAIGZ0eXBoZWljAAAAAG1pZjFpY2hlc21zYmhldmMAAAAsbWV0YQAAAAAAAAAiaW5mbyAAAAABAAAAEml0ZW0AAAAAAAEAAW1pZjEAAABDaWxvYwAAAAAEEAAAAB8AAQAAAAEAAAE8AAAAGAAAADhpaWRhdAAAAA542mNgYGBkYAAAAAUAAQ=='

let cachedSupport: boolean | null = null

const performImageTest = (resolve: (val: boolean) => void) => {
  const img = new Image()
  let resolved = false

  const cleanup = () => {
    img.onload = null
    img.onerror = null
    img.src = ''
  }

  const handleResolve = (value: boolean) => {
    if (!resolved) {
      resolved = true
      cachedSupport = value
      cleanup()
      resolve(value)
    }
  }

  img.onload = () => {
    handleResolve(true)
  }

  img.onerror = () => {
    handleResolve(false)
  }

  img.src = MINIMAL_HEIC_BASE64

  // 設置超時防止某些瀏覽器掛起
  setTimeout(() => {
    if (cachedSupport === null) {
      handleResolve(false)
    }
  }, 1000)
}

const checkHeicSupport = (): Promise<boolean> => {
  if (cachedSupport !== null) {
    return Promise.resolve(cachedSupport)
  }

  return new Promise((resolve) => {
    // 優先檢查 ImageDecoder API
    if (typeof ImageDecoder !== 'undefined' && ImageDecoder.isTypeSupported) {
      ImageDecoder.isTypeSupported('image/heic')
        .then((supported) => {
          if (supported) {
            cachedSupport = true
            resolve(true)
          } else {
            performImageTest(resolve)
          }
        })
        .catch(() => performImageTest(resolve))
    } else {
      performImageTest(resolve)
    }
  })
}

/**
 * 檢測瀏覽器是否支援 HEIC 圖片格式
 *
 * 檢測機制：
 * 1. 優先使用 ImageDecoder API 檢查 'image/heic' 支援度
 * 2. 若 API 不存在或不支援，則嘗試載入極小的 HEIC Base64 圖片作為 Fallback
 * 3. 檢測結果會被全域快取 (cachedSupport)，避免重複檢查
 *
 * @returns {Object} 包含響應式變數的物件
 * @returns {Ref<boolean>} isSupported - 是否支援 HEIC 格式
 */
export function useHeicSupport() {
  const isSupported = ref<boolean>(false)

  onMounted(async () => {
    isSupported.value = await checkHeicSupport()
  })

  return {
    isSupported,
  }
}
