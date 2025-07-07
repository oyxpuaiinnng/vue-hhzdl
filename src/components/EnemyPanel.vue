<template>
    <div class="enemy-container combat-unit character-panel">
      <h2>敌人</h2>
      <p>生命值: <span>{{ enemy.health }} / {{ enemy.maxHealth }}</span></p>
      <p>攻击力: <span>{{ enemy.attack }}</span></p>
      <p>攻击强化层数: <span>{{ enemy.boosted }}</span></p>
      <p>防御强化层数: <span>{{ enemy.defBoosted }}</span></p>
      <p>防御力: <span>{{ enemy.defence }}</span></p>
    </div>
  </template>
  
  <script>
  export default {
    props: ['enemy']
  };
  </script>
  
  <style scoped>
  /* 同样继承全局风格 */
  </style>
  