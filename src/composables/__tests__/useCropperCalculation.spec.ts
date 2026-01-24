import { describe, it, expect } from 'vitest'
import { calculateFitSelection } from '../useCropperCalculation'

const createMockRect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect

describe('calculateFitSelection', () => {
  const ASPECT_RATIO_9_16 = 9 / 16

  it('計算標準情況：正方形圖片，70% 覆蓋率', () => {
    const imageRect = createMockRect(100, 50, 400, 400)
    const canvasRect = createMockRect(0, 0, 600, 600)
    const result = calculateFitSelection(imageRect, canvasRect, ASPECT_RATIO_9_16, 0.7)

    expect(result).toBeDefined()
    expect(result!.width).toBeCloseTo(157.5, 1)
    expect(result!.height).toBeCloseTo(280, 1)
    expect(result!.x).toBeCloseTo(221.25, 1)
    expect(result!.y).toBeCloseTo(110, 1)
  })

  it('計算橫向圖片（寬 > 高）', () => {
    const imageRect = createMockRect(50, 150, 800, 400)
    const canvasRect = createMockRect(0, 0, 900, 700)
    const result = calculateFitSelection(imageRect, canvasRect, ASPECT_RATIO_9_16, 0.7)

    expect(result).toBeDefined()
    expect(result!.width).toBeCloseTo(157.5, 1)
    expect(result!.height).toBeCloseTo(280, 1)
  })

  it('計算直向圖片（高 > 寬）', () => {
    const imageRect = createMockRect(200, 50, 300, 600)
    const canvasRect = createMockRect(0, 0, 700, 800)
    const result = calculateFitSelection(imageRect, canvasRect, ASPECT_RATIO_9_16, 0.7)

    expect(result).toBeDefined()
    expect(result!.width).toBeCloseTo(210, 1)
    expect(result!.height).toBeCloseTo(373.33, 1)
  })

  it('覆蓋率 100%', () => {
    const imageRect = createMockRect(0, 0, 500, 500)
    const canvasRect = createMockRect(0, 0, 500, 500)
    const result = calculateFitSelection(imageRect, canvasRect, ASPECT_RATIO_9_16, 1.0)

    expect(result).toBeDefined()
    expect(result!.width).toBeCloseTo(281.25, 1)
    expect(result!.height).toBeCloseTo(500, 1)
  })

  it('覆蓋率 50%', () => {
    const imageRect = createMockRect(0, 0, 500, 500)
    const canvasRect = createMockRect(0, 0, 500, 500)
    const result = calculateFitSelection(imageRect, canvasRect, ASPECT_RATIO_9_16, 0.5)

    expect(result).toBeDefined()
    expect(result!.width).toBeCloseTo(250, 0)
    expect(result!.height).toBeCloseTo(444.44, 1)
  })

  it('選取框置中於圖片', () => {
    const imageRect = createMockRect(100, 100, 400, 400)
    const canvasRect = createMockRect(0, 0, 600, 600)
    const result = calculateFitSelection(imageRect, canvasRect, ASPECT_RATIO_9_16, 0.6)

    expect(result).toBeDefined()

    const imgCenterX = imageRect.left + imageRect.width / 2
    const imgCenterY = imageRect.top + imageRect.height / 2
    const selectionCenterX = result!.x + result!.width / 2
    const selectionCenterY = result!.y + result!.height / 2

    expect(selectionCenterX).toBeCloseTo(imgCenterX, 1)
    expect(selectionCenterY).toBeCloseTo(imgCenterY, 1)
  })

  it('極端情況：非常小的圖片', () => {
    const imageRect = createMockRect(0, 0, 10, 10)
    const canvasRect = createMockRect(0, 0, 500, 500)
    const result = calculateFitSelection(imageRect, canvasRect, ASPECT_RATIO_9_16, 0.7)

    expect(result).toBeDefined()
    expect(result!.width).toBeGreaterThan(0)
    expect(result!.height).toBeGreaterThan(0)
  })

  it('邊界情況：圖片尺寸為 0 應返回 null', () => {
    const imageRect = createMockRect(0, 0, 0, 0)
    const canvasRect = createMockRect(0, 0, 500, 500)
    const result = calculateFitSelection(imageRect, canvasRect, ASPECT_RATIO_9_16, 0.7)

    expect(result).toBeNull()
  })

  it('不同 aspect ratio: 1:1 (正方形)', () => {
    const imageRect = createMockRect(0, 0, 400, 400)
    const canvasRect = createMockRect(0, 0, 600, 600)
    const result = calculateFitSelection(imageRect, canvasRect, 1, 0.7)

    expect(result).toBeDefined()
    expect(result!.width).toBeCloseTo(result!.height, 1)
  })

  it('不同 aspect ratio: 16:9 (橫向)', () => {
    const imageRect = createMockRect(0, 0, 400, 400)
    const canvasRect = createMockRect(0, 0, 600, 600)
    const result = calculateFitSelection(imageRect, canvasRect, 16 / 9, 0.7)

    expect(result).toBeDefined()
    expect(result!.width).toBeGreaterThan(result!.height)
  })
})
