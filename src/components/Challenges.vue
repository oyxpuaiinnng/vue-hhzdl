<!-- src/components/Challenges.vue -->
<script setup>
import { useGameStore } from '../store'
import { computed } from 'vue'

const store = useGameStore()

// 挑战陈瑞洋
function challengeCry() {
    store.cryChallenge()
}

// 挑战东方不败
function challengeDfbb() {
    store.dfbbChallenge()
}
</script>

<template>
    <div class="challenges-panel">
        <h2>椰社挑战</h2>
        <div class="buttons">
            <button @click="challengeCry">
                花费 604 挑战 陈瑞洋
            </button>
            <button @click="challengeDfbb">
                花费 1980 挑战 东方不败
            </button>
        </div>
    </div>
</template>

<style scoped>
.challenges-panel {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 16px;
    margin: 20px 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.challenges-panel h2 {
    margin-bottom: 12px;
    color: #ffd93d;
    font-size: 1.2em;
}

.buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.buttons button {
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    border: none;
    color: white;
    padding: 10px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: transform 0.2s;
}

.buttons button:hover {
    transform: translateY(-2px);
}
</style>
