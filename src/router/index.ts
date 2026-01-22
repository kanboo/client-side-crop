import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/movable-cropping',
      name: 'movable-cropping-only',
      component: () => import('@/views/MovableCroppingOnlyView.vue'),
      meta: { title: '裁切模式 (可移動裁切框)' },
    },
    {
      path: '/movable-cropping/preview',
      name: 'movable-cropping-with-preview',
      component: () => import('@/views/MovableCroppingWithPreviewView.vue'),
      meta: { title: '裁切 + 預覽 (可移動裁切框)' },
    },
    {
      path: '/movable-background-image',
      name: 'movable-background-image-only',
      component: () => import('@/views/MovableBackgroundImageOnlyView.vue'),
      meta: { title: '裁切模式 (可移動背景)' },
    },
    {
      path: '/movable-background-image/preview',
      name: 'movable-background-image-with-preview',
      component: () => import('@/views/MovableBackgroundImageWithPreviewView.vue'),
      meta: { title: '裁切 + 預覽 (可移動背景)' },
    },
    {
      path: '/',
      redirect: '/movable-background-image',
    },
  ],
})

export default router
