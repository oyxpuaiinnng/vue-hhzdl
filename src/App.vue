<template>
    <div id="app">
      <header><h1>回合制地牢</h1></header>
      <router-view/>
    </div>
  </template>
  
  <script>
  export default {
    name: 'App'
  };
  </script>
  
  <style>
  /* 顶部标题使用高亮渐变文字 */
  #app header h1 {
    background: linear-gradient(45deg, #ff6b6b, #ffd93d);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  </style>
  