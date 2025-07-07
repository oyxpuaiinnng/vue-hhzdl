<template>
    <div class="player-container combat-unit character-panel">
      <h2>玩家</h2>
      <p>生命值: <span>{{ player.health }} / {{ player.maxHealth }}</span></p>
      <p>攻击力: <span>{{ player.attack }}</span></p>
      <p>攻击强化层数: <span>{{ player.boosted }}</span></p>
      <p>防御强化层数: <span>{{ player.defBoosted }}</span></p>
      <p>防御力: <span>{{ player.defence }}</span></p>
      <p>技能点: <span>{{ player.skillRate }}</span></p>
    </div>
  </template>
  
  <script>
  export default {
    props: ['player']
  };
  </script>
  
  <style scoped>
  /* 继承全局样式，无需额外更改 */
  </style>
  