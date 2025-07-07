<template>
    <div class="skill-tree">
        <h2>技能树</h2>
        <div v-for="([key, sk]) in visibleSkills" :key="key" class="skill-entry" @mouseenter="hover = key"
            @mouseleave="hover = null">
            <div class="skill-info">
                <span class="skill-name">{{ sk.name }} (Lv{{ sk.level }})</span>
                <button class="upgrade-btn" @click="upgrade(key)" :disabled="!canUpgrade(key)">
                    升级
                </button>
                <button class="equip-btn" @click="toggle(key)" :class="{ equipped: pendingSkills.includes(key) }"
                    :disabled="!canToggle(key)">
                    {{ pendingSkills.includes(key) ? '已装备' : '装备' }}
                </button>
            </div>
            <div v-if="hover === key" class="tooltip">
                <pre>{{ typeof sk.description === 'function' ? sk.description(sk.level) : sk.description }}</pre>
                <div class="cost">升级消耗：{{ sk.cost(sk.level) }} 技能点</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useGameStore } from '../store';

const store = useGameStore();
const player = computed(() => store.player);
const pendingSkills = computed(() => store.pendingSkills);
const hover = ref(null);

const visibleSkills = computed(() =>
    Object.entries(player.value.skillTree).filter(([_, sk]) =>
        sk.dependencies.every(dep => player.value.skillTree[dep]?.level > 0 || dep === 'normalAtk')
    )
);

onMounted(checkFallbackSkill);
watch(pendingSkills, checkFallbackSkill);
function toggle(key) {
    store.togglePendingSkill(key);
}
function canToggle(key) {
    const sk = player.value.skillTree[key];
    return sk.level > 0;
}
function upgrade(key) {
    store.upgradeSkill(key);
}
function canUpgrade(key) {
    const sk = player.value.skillTree[key];
    return sk.level < sk.maxLevel &&
        sk.dependencies.every(dep => player.value.skillTree[dep].level > 0) &&
        player.value.skillRate >= sk.cost(sk.level);
}
function checkFallbackSkill() {
    if (pendingSkills.value.length === 0) {
        store._log('未选择任何技能，自动装备普通攻击');
        store.togglePendingSkill('normalAtk');
    }
}
</script>

<style scoped>
.skill-tree {
    background: rgba(0, 0, 0, 0.3);
    padding: 16px;
    border-radius: 8px;
}

.skill-entry {
    position: relative;
    margin-bottom: 12px;
    padding: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.skill-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.skill-name {
    flex: 1;
    color: #4ecdc4;
    font-weight: bold;
}

button {
    background: linear-gradient(45deg, #4ecdc4, #45b7af);
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 0.9em;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.upgrade-btn {
    background: #2e86de;
}

.equip-btn {
    background: #ff9f43;
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
    font-size: 0.85em;
}

.cost {
    margin-top: 6px;
    color: #ffd93d;
    font-size: 0.8em;
}
</style>