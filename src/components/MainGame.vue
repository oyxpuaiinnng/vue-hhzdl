<script setup>
import { onBeforeMount, computed, ref } from 'vue';
import { useGameStore } from '../store';

import PlayerPanel from './PlayerPanel.vue';
import EnemyPanel from './EnemyPanel.vue';
import SkillTree from './SkillTree.vue';
import EquipmentPanel from './EquipmentPanel.vue';
import CombatLog from './CombatLog.vue';
import Challenges from './Challenges.vue';

const store = useGameStore();
const saveText = ref('');
const logs = computed(() => store.logs);
const player = computed(() => store.player);
const enemy = computed(() => store.enemy);

onBeforeMount(() => {
    if (!store.player) {
        const name = prompt('你的名字？') || '冒险者';
        store.init(name);
    }
});

function useSkill(skillKey) {
    store.playerUseSkill(skillKey);
}

function saveGame() {
    saveText.value = store.exportSave();
}

function loadGame() {
    store.importSave(saveText.value);
}
//202507011414
</script>

<template>
    <div v-if="player" class="main-game">
        <div class="combat-main">
            <!-- 玩家和敌人面板 -->
            <PlayerPanel :player="player" />
            <EnemyPanel :enemy="enemy" />
        </div>

        <!-- 主动技能按钮 -->
        <div class="active-skill-buttons" v-if="player?.activeSkills && player?.skillTree">
            <button v-for="skill in player.activeSkills" :key="skill" @click="useSkill(skill)">
                {{ player.skillTree[skill]?.name || skill }} (Lv{{ player.skillTree[skill]?.level || 0 }})
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