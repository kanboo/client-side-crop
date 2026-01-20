<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>圖片裁切工具</h1>
      <p>支援 9:16 比例裁切，可放大縮小，保持原格式輸出</p>

      <nav class="nav">
        <RouterLink to="/" class="nav-link" active-class="active">裁切模式</RouterLink>
        <RouterLink to="/preview" class="nav-link" active-class="active">裁切 + 預覽</RouterLink>
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
  gap: 20px;
}

.nav-link {
  text-decoration: none;
  color: #4b5563;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.2s;
  background-color: #f3f4f6;
}

.nav-link:hover {
  background-color: #e5e7eb;
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
