/**
 * Cropper.js v2 型別擴充
 * 官方已匯出基本型別,這裡僅補充專案需要的額外方法定義
 *
 * 官方文件: https://fengyuanchen.github.io/cropperjs/
 * 最後同步版本: v2.1.0
 *
 * ⚠️ 升級 cropperjs 時請檢查此檔案是否需要更新
 */

// 從 cropperjs 匯入官方型別
import type {
  CropperSelection as BaseCropperSelection,
  CropperImage as BaseCropperImage,
  CropperCanvas,
} from 'cropperjs'

// 擴充 CropperSelection,加入專案使用的方法
declare module 'cropperjs' {
  export interface CropperSelection extends BaseCropperSelection {
    x: number
    y: number
    width: number
    height: number
    aspectRatio: number
    $toCanvas(options?: {
      width?: number
      height?: number
      beforeDraw?: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
    }): Promise<HTMLCanvasElement>
    $center(): CropperSelection
    $reset(): CropperSelection
    $clear(): CropperSelection
  }

  export interface CropperImage extends BaseCropperImage {
    src: string
    $getTransform(): [number, number, number, number, number, number]
  }
}

// 註冊 HTML 元素標籤對應
declare global {
  interface HTMLElementTagNameMap {
    'cropper-canvas': CropperCanvas
    'cropper-image': import('cropperjs').CropperImage
    'cropper-selection': import('cropperjs').CropperSelection
    'cropper-shade': HTMLElement
    'cropper-handle': HTMLElement
    'cropper-grid': HTMLElement
    'cropper-crosshair': HTMLElement
    'cropper-viewer': HTMLElement
  }
}

export {}
