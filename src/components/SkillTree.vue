<template>
    <div class="skill-tree">
        <h2>技能树</h2>
        <div class="character-switcher">
            <button v-for="(ch, idx) in playerParty" :key="idx" @click="selectCharacter(idx)"
                :class="{ active: idx === selectedIndex }">
                {{ ch.name  }}（技能点：{{ ch.skillRate }}）
            </button>
        </div>
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
                <div class="cost">升级消耗：{{ sk.cost(sk.level) }} 技能点, 等级上限：{{ sk.maxLevel }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { useGameStore } from '../store';
//await nextTick();
onMounted(async () => {
    await nextTick();
    //console.log('skillTree ready?', selectedCharacter.value?.skillTree);
});

const store = useGameStore();
const playerParty = computed(() => store.playerParty);
const selectedIndex = ref(0);
const selectedCharacter = computed(() => playerParty.value[selectedIndex.value]);
function selectCharacter(i) {
    selectedIndex.value = i;
}
const pendingSkills = computed(() => selectedCharacter.value.pendingSkills);

const hover = ref(null);

const visibleSkills = computed(() =>
    Object.entries(selectedCharacter.value.skillTree).filter(([_, sk]) =>
        sk.dependencies.every(dep => selectedCharacter.value.skillTree[dep]?.level > 0 || dep === 'normalAtk')
    )
);

onMounted(checkFallbackSkill);
watch(pendingSkills, checkFallbackSkill);
function toggle(key) {
    selectedCharacter.value.togglePendingSkill(key);
}
function canToggle(key) {
    const sk = selectedCharacter.value.skillTree[key];
    return sk.level > 0;
}
function upgrade(key) {
    store.upgradeSkill(selectedCharacter.value, key);
}
function canUpgrade(key) {
    const sk = selectedCharacter.value.skillTree[key];
    return sk.level < sk.maxLevel &&
        sk.dependencies.every(dep => selectedCharacter.value.skillTree[dep].level > 0) &&
        selectedCharacter.value.skillRate >= sk.cost(sk.level);
}
function checkFallbackSkill() {
    if (pendingSkills.value.length === 0) {
        store._log('未选择任何技能，自动装备普通攻击');
        selectedCharacter.value.togglePendingSkill('normalAtk');
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