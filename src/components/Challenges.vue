<!-- src/components/Challenges.vue -->
<script setup>
import { computed } from 'vue'
import { useGameStore } from '../store'
import { challenges } from '../data/challenges'

const store = useGameStore()

// 按钮点击后发起挑战
function startChallenge(id) {
  store.startChallenge(id)
}
</script>

<template>
  <div class="challenges-panel">
    <h2>椰社挑战</h2>
    <div class="buttons">
      <button
        v-for="c in challenges"
        :key="c.id"
        @click="startChallenge(c.id)"
      >
        挑战 {{ c.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.challenges-panel {
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

h2 {
  margin-bottom: 10px;
  color: #4ecdc4;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

button {
  background: linear-gradient(45deg, #ff9f43, #ff6f3c);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  transition: 0.2s ease;
}

button:hover {
  transform: translateY(-2px);
}
</style>
