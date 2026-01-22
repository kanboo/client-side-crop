<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>圖片裁切工具</h1>
      <p>支援 9:16 比例裁切，可放大縮小，保持原格式輸出</p>

      <nav class="nav">
        <div class="nav-group">
          <div class="nav-label">可移動背景圖片</div>
          <RouterLink to="/movable-background-image" class="nav-link" exact-active-class="active"
            >裁切模式</RouterLink
          >
          <RouterLink
            to="/movable-background-image/preview"
            class="nav-link"
            exact-active-class="active"
            >裁切 + 預覽</RouterLink
          >
        </div>

        <div class="nav-group">
          <div class="nav-label">可移動裁切框</div>
          <RouterLink to="/movable-cropping" class="nav-link" exact-active-class="active"
            >裁切模式</RouterLink
          >
          <RouterLink to="/movable-cropping/preview" class="nav-link" exact-active-class="active"
            >裁切 + 預覽</RouterLink
          >
        </div>
      </nav>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
}

.header {
  text-align: center;
  padding: 40px 20px 20px;
}

.nav {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 40px;
}

.nav-group {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: white;
  padding: 8px 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  padding-right: 8px;
  border-right: 2px solid #e5e7eb;
}

.nav-link {
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-link:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.nav-link.active {
  background-color: #3b82f6;
  color: white;
}

.header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px;
}

.header p {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.main {
  padding: 20px;
}
</style>
