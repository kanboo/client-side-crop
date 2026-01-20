import { createRouter, createWebHistory } from 'vue-router'
import CropOnlyView from '@/views/CropOnlyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'crop-only',
      component: CropOnlyView,
    },
    {
      path: '/preview',
      name: 'crop-with-preview',
      component: () => import('@/views/CropWithPreviewView.vue'),
    },
  ],
})

export default router
