<template>
    <div class="equipment-panel">
        <h2>装备栏</h2>
        <div class="character-switcher">
            <button v-for="(ch, idx) in playerParty" :key="idx" @click="selectCharacter(idx)"
                :class="{ active: idx === selectedIndex }">
                {{ ch.name }}
            </button>
        </div>
        <div class="grid" :style="`grid-template-columns: repeat(${cols}, 1fr)`">
            <div v-for="(item, idx) in equipmentList" :key="idx" class="equip-card" @mouseenter="hover = idx"
                @mouseleave="hover = null">
                <div class="equip-name">{{ item.name }}</div>
                <div class="equip-actions">
                    <button class="equip-btn" @click="equip(idx)">装备</button>
                    <button class="sell-btn" @click="sell(idx)">出售</button>
                </div>
                <div v-if="hover === idx" class="tooltip">
                    <div>类型：{{ item.equipmentClass }}</div>
                    <div v-if="item.atkPlus">攻击 +{{ item.atkPlus }}</div>
                    <div v-if="item.atkMult">攻击乘数 {{ item.atkMult.toFixed(2) }}</div>
                    <div v-if="item.healthPlus">生命 +{{ item.healthPlus }}</div>
                    <div v-if="item.healthMult">生命乘数 {{ item.healthMult.toFixed(2) }}</div>
                    <div v-if="item.defPlus">防御 +{{ item.defPlus }}</div>
                    <div v-if="item.defMult">防御乘数 {{ item.defMult.toFixed(2) }}</div>
                    <div v-if="item.effect && item.effect.length">
                        <div v-for="([eff, val], i) in item.effect" :key="i">
                            特效 {{ eff }}: {{ val }}
                        </div>
                    </div>
                    <div>稀有度: {{ item.rary }}</div>
                    <div>技能点: {{ item.skillRate }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, defineProps } from 'vue';
import { useGameStore } from '../store';
onMounted(async () => {
    await nextTick();
    //console.log('skillTree ready?', selectedCharacter.value?.skillTree);
});
    const store = useGameStore();
const playerParty = computed(() => store.playerParty);
const selectedIndex = ref(0);
const selectedCharacter = computed(() => playerParty.value[selectedIndex.value]);

const props = defineProps({
    cols: { type: Number, default: 5 }
});

const hover = ref(null);
const equipmentList = computed(() => selectedCharacter.value.equipmentList || []);

function selectCharacter(i) {
  selectedIndex.value = i;
}


// 写入 pending，下次战斗生效
function equip(idx) {
  store.equipItem(selectedCharacter.value, idx);
}

// 立即卖出，获得技能点
function sell(idx) {
  store.sellItem(selectedCharacter.value, idx);
}
</script>

<style scoped>
.equipment-panel {
    background: rgba(0, 0, 0, 0.3);
    padding: 16px;
    border-radius: 8px;
}

.equipment-panel h2 {
    margin-bottom: 12px;
    color: #ffd93d;
}

.grid {
    display: grid;
    gap: 12px;
}

.equip-card {
    background: rgba(255, 255, 255, 0.05);
    padding: 8px;
    position: relative;
    border-radius: 6px;
    text-align: center;
}

.equip-name {
    font-weight: bold;
    color: #4ecdc4;
    margin-bottom: 6px;
}

.equip-actions {
    display: flex;
    justify-content: center;
    gap: 6px;
}

button {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    color: white;
    font-size: 0.85em;
    cursor: pointer;
}

.equip-btn {
    background: #2ecc71;
}

.sell-btn {
    background: #e74c3c;
}

.tooltip {
    position: absolute;
    top: 100%;
    left: 0;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 8px;
    border-radius: 4px;
    white-space: pre-wrap;
    z-index: 10;
    margin-top: 4px;
    font-size: 0.8em;
    text-align: left;
}

.character-switcher {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  justify-content: center;
}

.character-switcher button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #4ecdc4;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.character-switcher button.active {
  background: #4ecdc4;
  color: #000;
  font-weight: bold;
}
</style>