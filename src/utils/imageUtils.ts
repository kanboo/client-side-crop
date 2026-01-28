import { EXPORT_IMAGE_QUALITY, EXPORT_WEBP_QUALITY } from '@/composables/useCropper'

/**
 * 圖片匯出結果介面
 */
export interface OptimizedBlobResult {
  /** 圖片 Blob 物件 */
  blob: Blob
  /** 圖片 MIME type (例如: image/webp) */
  mimeType: string
  /** 建議的檔案副檔名 (包含點號，例如: .webp) */
  extension: string
}

/**
 * 取得最佳化後的圖片 Blob
 *
 * @description
 * 此函式實作了「WebP 優先」的匯出策略：
 * 1. 優先嘗試將 Canvas 匯出為 WebP 格式 (品質: EXPORT_WEBP_QUALITY)
 * 2. 若瀏覽器不支援 WebP (例如舊版 iOS)，則自動 Fallback 回 JPEG (品質: EXPORT_IMAGE_QUALITY)
 *
 * 這樣可以在支援的瀏覽器上獲得更小的檔案大小與更好的畫質，
 * 同時確保在舊版瀏覽器上的相容性。
 *
 * @param {HTMLCanvasElement} canvas - 來源 Canvas 元素
 * @returns {Promise<OptimizedBlobResult>} 包含 Blob、MimeType 與副檔名的結果物件
 */
export const getOptimizedBlob = (canvas: HTMLCanvasElement): Promise<OptimizedBlobResult> => {
  return new Promise((resolve, reject) => {
    // 優先嘗試 WebP 格式
    canvas.toBlob(
      (blob) => {
        // 檢查是否成功匯出為 WebP
        // iOS < 14 等不支援 WebP 的瀏覽器，即使指定 image/webp，也會回傳 image/png 或 image/jpeg
        if (blob && blob.type === 'image/webp') {
          resolve({
            blob,
            mimeType: 'image/webp',
            extension: '.webp',
          })
          return
        }

        // WebP 失敗，Fallback 到 JPEG
        // 使用 JPEG 而非 PNG，以避免檔案過大 (除非原圖有透明度需求，但在照片裁切場景通常以 JPEG 為主)
        canvas.toBlob(
          (jpegBlob) => {
            if (jpegBlob) {
              resolve({
                blob: jpegBlob,
                mimeType: 'image/jpeg',
                extension: '.jpg',
              })
            } else {
              reject(new Error('圖片匯出失敗 (JPEG Fallback)'))
            }
          },
          'image/jpeg',
          EXPORT_IMAGE_QUALITY,
        )
      },
      'image/webp',
      EXPORT_WEBP_QUALITY,
    )
  })
}
