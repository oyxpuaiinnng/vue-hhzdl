<template>
    <div class="combat-log">
      <h2>战斗日志</h2>
      <div class="log-messages">
        <pre v-html="logs.join('\n')"></pre>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['logs']
  };
  </script>
  
  <style scoped>
  .combat-log {
    margin-top: 10px;
    background: rgba(0,0,0,0.5);
    border-radius: 6px;
    padding: 10px;
    max-height: 200px;
    overflow-y: auto;
  }
  pre {
    white-space: pre-wrap;
    color: #ffd93d;
  }
  </style>
  