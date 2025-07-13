<script setup>
import { onBeforeMount, computed, ref } from 'vue';
import { useGameStore } from '../store';

import SkillTree from './SkillTree.vue';
import EquipmentPanel from './EquipmentPanel.vue';
import CombatLog from './CombatLog.vue';
import Challenges from './Challenges.vue';
import CampPanel from './CampPanel.vue';
import BattleDivider from './BattleDivider.vue';

const store = useGameStore();
const saveText = ref('');
const logs = computed(() => store.logs);
/*
const player = computed(() => store.player);
const enemy = computed(() => store.enemy);
*/
const playerParty = computed(() => store.playerParty);
const enemyParty = computed(() => store.enemyParty);
console.log(playerParty[0]);//不为空

onBeforeMount(() => {
  if (store.playerParty.length === 0) {
    const name = prompt('你的名字？') || '小猫咪';
    store.initPlayerParty([name]);
    store.initBattle(1);
  }
});

const currentActor = computed(() => store.currentActor);
const mode = computed(() => store.mode);

function handleSelect(ch) {
    if (mode.value === 'selectActor' && ch.isPlayer) {
        //store.nextActor(ch);
        console.log("这可能是一个bug……");
    } else if (mode.value === 'selectTarget') {
        store.selectTarget(ch);
    }
}

function selectSkill(key) {
    store.selectSkill(key);
}

function saveGame() {
    saveText.value = store.exportSave();
}

function loadGame() {
    store.importSave(saveText.value);
}
</script>

<template>
    <div class="main-game">
        <div class="combat-main">
            <!-- 玩家阵营 -->
            <CampPanel :party="playerParty" :isPlayerCamp="true"
                :selectable="mode === 'selectActor' || mode === 'selectTarget'" :currentActor="currentActor"
                @select="handleSelect" />

            <BattleDivider />

            <!-- 敌人阵营 -->
            <CampPanel :party="enemyParty" :selectable="mode === 'selectActor' || mode === 'selectTarget'"
                :currentActor="currentActor" @select="handleSelect" />
        </div>


        <!-- 主动技能按钮 -->
        <div v-if="mode === 'selectSkill'" class="active-skill-buttons">
            <button v-for="key in currentActor?.activeSkills || []" :key="key" @click="selectSkill(key)">
                {{ currentActor.skillTree[key].name }} (Lv{{ currentActor.skillTree[key].level }})
            </button>
        </div>

        <!-- 战斗日志 -->
        <CombatLog :logs="logs" />
    </div>

    <div class="challenges">
        <Challenges />
    </div>

    <div class="game-actions">
        <!-- 装备与出售 -->
        <EquipmentPanel />
        <!-- 技能树和升级 -->
        <SkillTree />

        <!-- 存档/读档 -->
        <div class="save-load">
            <textarea v-model="saveText" rows="3" placeholder="存档数据"></textarea>
            <button @click="saveGame">保存</button>
            <button @click="loadGame">读取</button>
        </div>
    </div>
</template>

<style scoped>
.main-game {
    padding: 16px;
}

.combat-main {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
}

.active-skill-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin: 10px 0;
}

button {
    background: linear-gradient(45deg, #4ecdc4, #45b7af);
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 20px;
    cursor: pointer;
    transition: 0.2s ease;
}

button:hover {
    transform: translateY(-2px);
}

.save-load {
    margin-top: 20px;
}

textarea {
    width: 100%;
    background: rgba(0, 0, 0, 0.2);
    color: #fff;
    border: 1px solid #4ecdc4;
    border-radius: 5px;
    padding: 8px;
    font-family: monospace;
}
</style>