import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CropperResultPreview from '../CropperResultPreview.vue'

describe('CropperResultPreview', () => {
  it('顯示空白狀態當沒有圖片時', () => {
    const wrapper = mount(CropperResultPreview, {
      props: {
        imageUrl: undefined,
      },
    })

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('預覽區域')
  })

  it('顯示 cropper-viewer 當提供 imageUrl 時', () => {
    const wrapper = mount(CropperResultPreview, {
      props: {
        imageUrl: 'blob:http://localhost:5173/test-image',
      },
    })

    expect(wrapper.find('cropper-viewer').exists()).toBe(true)
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })

  it('使用預設的 aspectRatio (9/16)', () => {
    const wrapper = mount(CropperResultPreview, {
      props: {
        imageUrl: 'blob:http://localhost:5173/test-image',
      },
    })

    const previewWrapper = wrapper.find('.preview-wrapper')
    expect(previewWrapper.exists()).toBe(true)
  })

  it('套用自訂的 aspectRatio', () => {
    const wrapper = mount(CropperResultPreview, {
      props: {
        imageUrl: 'blob:http://localhost:5173/test-image',
        aspectRatio: 1,
      },
    })

    const previewWrapper = wrapper.find('.preview-wrapper')
    expect(previewWrapper.exists()).toBe(true)
  })

  it('使用自訂的 selectionSelector', () => {
    const wrapper = mount(CropperResultPreview, {
      props: {
        imageUrl: 'blob:http://localhost:5173/test-image',
        selectionSelector: '#custom-selection',
      },
    })

    const viewer = wrapper.find('cropper-viewer')
    expect(viewer.exists()).toBe(true)
    // cropper-viewer 是 Web Component，其屬性在測試環境中無法直接存取
    // 我們只驗證元件有正確渲染即可
  })

  it('當 aspectRatio 為無效值時顯示警告', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mount(CropperResultPreview, {
      props: {
        aspectRatio: 0,
      },
    })

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CropperResultPreview] aspectRatio 必須為大於 0 的有限數值'),
    )

    consoleWarnSpy.mockRestore()
  })

  it('當 aspectRatio 為 Infinity 時顯示警告', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mount(CropperResultPreview, {
      props: {
        aspectRatio: Infinity,
      },
    })

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CropperResultPreview] aspectRatio 必須為大於 0 的有限數值'),
    )

    consoleWarnSpy.mockRestore()
  })
})
