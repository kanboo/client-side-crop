declare module 'cropperjs' {
  export interface CropperSelection extends HTMLElement {
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

  export interface CropperImage extends HTMLElement {
    src: string
  }

  export type CropperCanvas = HTMLElement

  export default class Cropper {
    constructor(
      element: HTMLImageElement | HTMLCanvasElement | string,
      options?: Record<string, unknown>,
    )
    getCropperSelection(): CropperSelection | null
    getCropperImage(): CropperImage | null
    destroy(): void
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cropper-canvas': import('cropperjs').CropperCanvas
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
