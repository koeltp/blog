<template>
  <div class="custom-layout">
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
.custom-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  max-width: 1400px;
  margin: 2rem auto;
  width: 100%;
  padding-top: 64px;
}

/* 让 main 在全宽布局时不受限 */
main:has(.page-wrapper),
main:has(.home-page) {
  max-width: none;
  margin: 0;
  padding-top: 0;
}

footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 2rem 0;
  margin-top: 4rem;
}
</style>
