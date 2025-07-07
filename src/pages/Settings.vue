<template>
    <div class="settings-page">
      <h2>设置</h2>
      <button @click="clearSave">清除本地存档</button>
      <button @click="reload">刷新页面</button>
      <p style="margin-top: 10px;">你可以在此处扩展音效控制、说明页、开发者信息等。</p>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Settings',
    methods: {
      clearSave() {
        if (confirm('确认要清除本地存档？')) {
          localStorage.clear();
          alert('本地存档已清除');
        }
      },
      reload() {
        location.reload();
      }
    }
  };
  </script>
  
  <style scoped>
  .settings-page {
    padding: 20px;
    color: #fff;
  }
  button {
    margin-right: 10px;
  }
  </style>
  