<template>
  <div class="layout">
    <NavBar />

    <!-- 页面内容 -->
    <main>
      <Content />
    </main>

    <!-- 页脚 -->
    <footer>
      <p>&copy; 2026 太皮. 保留所有权利.</p>
    </footer>
  </div>
</template>

<script setup>
import NavBar from './NavBar.vue'
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  width: 100%;
}

footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 2rem 0;
  margin-top: 4rem;
}
</style>
