<template>
    <main class="home-page">
      <MainGame />
    </main>
  </template>
  
  <script>
  import MainGame from '../components/MainGame.vue';
  
  export default {
    name: 'Home',
    components: {
      MainGame
    }
  };
  //202507011416
  </script>
  
  <style scoped>
  .home-page {
    padding: 20px;
  }
  </style>
  