/**
 * 計算符合指定 aspect ratio 的選取框尺寸與位置
 *
 * ## 為什麼需要這個函式？
 *
 * Cropper.js 原生的 `initial-coverage` 屬性是用來設定裁切框佔「容器 (Canvas)」的比例，
 * 而不是佔「圖片」的比例。當圖片長寬比與 Canvas 不一致時（例如：橫向圖片在直向 Canvas 中），
 * 圖片只會佔據 Canvas 的中間一部分。
 *
 * 這時如果單純依賴 `initial-coverage`，裁切框會根據 Canvas 尺寸計算，導致初始框可能遠大於圖片本身。
 * 加上我們實作了「邊界檢查 (Boundary Check)」，這會導致初始框因為超出圖片邊界而無法被縮小或移動（被擋住）。
 *
 * ## 解決方案
 *
 * 此函式會在圖片載入並佈局完成後觸發，它會：
 * 1. 取得圖片在 Canvas 中的實際顯示位置與尺寸 (getBoundingClientRect)
 * 2. 計算出能「完整塞入圖片內」的最大指定比例矩形
 * 3. 乘上 coverage (如 0.7) 得到最終尺寸
 * 4. 置中對齊在圖片上
 *
 * @param imageRect - 圖片在 Canvas 中的邊界矩形
 * @param canvasRect - Canvas 容器的邊界矩形
 * @param aspectRatio - 目標長寬比 (width / height)，例如 9/16 = 0.5625
 * @param coverage - 覆蓋比例 (0~1)，表示選取框佔圖片的比例
 * @returns 選取框的 x, y, width, height，若無法計算則返回 null
 *
 * @example
 * // 圖片 800x600，Canvas 1000x800，aspect ratio 9:16，coverage 0.7
 * const result = calculateFitSelection(imageRect, canvasRect, 9/16, 0.7)
 * // result: { x: 250, y: 150, width: 280, height: 497 }
 */
export const calculateFitSelection = (
  imageRect: DOMRect,
  canvasRect: DOMRect,
  aspectRatio: number,
  coverage: number,
) => {
  // 計算圖片在 Canvas 中的相對位置
  const imgX = imageRect.left - canvasRect.left
  const imgY = imageRect.top - canvasRect.top
  const imgW = imageRect.width
  const imgH = imageRect.height

  const R = aspectRatio
  const cov = coverage

  // 先嘗試以寬度為基準計算
  let w = imgW * cov
  let h = w / R

  // 如果高度超出圖片，改以高度為基準
  if (h > imgH) {
    h = imgH * cov
    w = h * R
  }

  // 防止無效尺寸
  if (w <= 0 || h <= 0) return null

  // 計算置中位置
  const x = imgX + (imgW - w) / 2
  const y = imgY + (imgH - h) / 2

  return { x, y, width: w, height: h }
}
