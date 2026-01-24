import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope } from 'vue'
import { useCropper } from '../useCropper'

describe('useCropper', () => {
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL')
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
  })

  afterEach(() => {
    revokeObjectURLSpy.mockRestore()
    createObjectURLSpy.mockRestore()
  })

  describe('loadImage', () => {
    it('接受有效的 JPEG 檔案', () => {
      const scope = effectScope()
      scope.run(() => {
        const { loadImage, imageUrl, imageName, imageMimeType } = useCropper()

        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
        const result = loadImage(mockFile)

        expect(result.valid).toBe(true)
        expect(imageUrl.value).toBe('blob:mock-url')
        expect(imageName.value).toBe('test.jpg')
        expect(imageMimeType.value).toBe('image/jpeg')
        expect(createObjectURLSpy).toHaveBeenCalledWith(mockFile)
      })
      scope.stop()
    })

    it('接受有效的 PNG 檔案', () => {
      const scope = effectScope()
      scope.run(() => {
        const { loadImage, imageMimeType } = useCropper()

        const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
        const result = loadImage(mockFile)

        expect(result.valid).toBe(true)
        expect(imageMimeType.value).toBe('image/png')
      })
      scope.stop()
    })

    it('接受 WebP 格式', () => {
      const scope = effectScope()
      scope.run(() => {
        const { loadImage } = useCropper()

        const mockFile = new File(['test'], 'test.webp', { type: 'image/webp' })
        const result = loadImage(mockFile)

        expect(result.valid).toBe(true)
      })
      scope.stop()
    })

    it('拒絕不支援的檔案格式', () => {
      const scope = effectScope()
      scope.run(() => {
        const { loadImage, imageUrl } = useCropper()

        const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
        const result = loadImage(mockFile)

        expect(result.valid).toBe(false)
        expect(result.error).toContain('不支援的圖片格式')
        expect(imageUrl.value).toBe('')
        expect(createObjectURLSpy).not.toHaveBeenCalled()
      })
      scope.stop()
    })

    it('拒絕超過大小限制的檔案', () => {
      const scope = effectScope()
      scope.run(() => {
        const maxSize = 1024 * 1024
        const { loadImage } = useCropper(maxSize)

        const largeMockData = new Array(maxSize + 1).fill('a').join('')
        const mockFile = new File([largeMockData], 'large.jpg', { type: 'image/jpeg' })
        const result = loadImage(mockFile)

        expect(result.valid).toBe(false)
        expect(result.error).toContain('超過')
        expect(result.error).toContain('1MB')
      })
      scope.stop()
    })

    it('載入新圖片時釋放舊的 URL', () => {
      const scope = effectScope()
      scope.run(() => {
        const { loadImage } = useCropper()

        const mockFile1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
        loadImage(mockFile1)

        const mockFile2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
        loadImage(mockFile2)

        expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
        expect(createObjectURLSpy).toHaveBeenCalledTimes(2)
      })
      scope.stop()
    })
  })

  describe('clear', () => {
    it('清除所有狀態並釋放 URL', () => {
      const scope = effectScope()
      scope.run(() => {
        const { loadImage, clear, imageUrl, imageName, imageMimeType } = useCropper()

        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
        loadImage(mockFile)

        clear()

        expect(imageUrl.value).toBe('')
        expect(imageName.value).toBe('')
        expect(imageMimeType.value).toBe('')
        expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
      })
      scope.stop()
    })
  })

  describe('ACCEPT_STRING', () => {
    it('包含所有支援的副檔名', () => {
      const scope = effectScope()
      scope.run(() => {
        const { ACCEPT_STRING } = useCropper()

        expect(ACCEPT_STRING).toContain('.jpg')
        expect(ACCEPT_STRING).toContain('.png')
        expect(ACCEPT_STRING).toContain('.webp')
        expect(ACCEPT_STRING).toContain('.heic')
        expect(ACCEPT_STRING).toContain('.avif')
      })
      scope.stop()
    })
  })
})
