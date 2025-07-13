<template>
    <div class="character-card" :class="{ selectable: selectable, selected: isSelected }" @click="handleClick"
        @mouseenter="hover = true" @mouseleave="hover = false">
        <!-- 右上角等级角标 -->
        <div class="badge">Lv {{ props.character.level }}</div>

        <!-- 名字 -->
        <div class="name">{{ props.character.name }}</div>

        <!-- HP / MP / 经验条 -->
        <div class="bar hp-bar">
            <div class="fill" :style="{ width: hpPercent + '%' }"></div>
            <div class="label">{{ props.character.health }} / {{ props.character.maxHealth }}</div>
        </div>
        <div class="bar mp-bar">
            <div class="fill" :style="{ width: mpPercent + '%' }"></div>
            <div class="label">{{ props.character.mp }} / {{ props.character.maxMp }}</div>
        </div>
        <div class="bar exp-bar">
            <div class="fill" :style="{ width: (props.character.exp / props.character.expToNext * 100) + '%' }"></div>
            <span class="text">{{ props.character.exp }} / {{ props.character.expToNext }} EXP</span>
        </div>

        <!-- 头像 -->
        <div class="avatar">
            <img :src="avatarSrc" @error="handleImageError" alt="avatar" />
        </div>
        <div>
            <!-- 血条等其他UI -->
            <div v-if="hover" class="tooltip">
                <div>攻击: {{ character.attack }} </div>
                <div>防御: {{ character.defence }} </div>

                <!-- 悬停显示 Buff 列表 -->
                <div v-if="props.character.effects.length">
                    <div v-for="(e, i) in props.character.effects" :key="i">
                        {{ e[2].trigger }}：剩 {{ e[2].remaining }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
const BASE = import.meta.env.BASE_URL;
const props = defineProps({
    party: { type: Array, required: true },
    isPlayerCamp: { type: Boolean, default: true },
    selectable: { type: Boolean, default: false },
    currentActor: { type: Object, default: null },
    character: { type: Object }
});
//console.log(props.character);
const emit = defineEmits(['select']);

const hover = ref(false);

const hpPercent = computed(() =>
    Math.floor((props.character.health / props.character.maxHealth) * 100)
);
const mpPercent = computed(() =>
    Math.floor((props.character.mp / props.character.maxMp) * 100)
);

function handleClick() {
    if (props.selectable) {
        emit('select', props.character);
    }
}
const avatarSrc = ref(BASE + 'img/avatars/' + props.character.avatarUrl);
avatarSrc.value =BASE + 'img/avatars/' + props.character.avatarUrl;
watch(() => props.character.avatarUrl, (newUrl) => {
  avatarSrc.value = BASE + 'img/avatars/' + newUrl;
});
function handleImageError() {
    avatarSrc.value = BASE + 'img/avatars/hajimi.png';
}
</script>

<style scoped>
.character-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px;
    position: relative;
    width: 120px;
    min-height: 160px;
    text-align: center;
    user-select: none;
}

.character-card.selectable {
    cursor: pointer;
}

.character-card.selected {
    box-shadow: 0 0 0 2px #ffd93d;
}

.badge {
    position: absolute;
    top: 4px;
    right: 6px;
    background: #ff6b6b;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 0.75em;
    color: white;
}

.name {
    font-weight: bold;
    color: #4ecdc4;
    margin-bottom: 6px;
}

.bar {
    position: relative;
    height: 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    margin: 4px 0;
}

.fill {
    height: 100%;
    border-radius: 6px;
}

.hp-bar .fill {
    background: #2ecc71;
}

.mp-bar .fill {
    background: #3498db;
}


.exp-bar .fill {
    background: #f1c40f;
}

.label {
    position: absolute;
    top: 0;
    right: 4px;
    font-size: 0.7em;
    color: white;
}

.avatar {
    margin-top: 6px;
    width: 100%;
    padding-top: 100%;
    position: relative;
}

.avatar img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.tooltip {
    position: absolute;
    bottom: 100%;
    left: 0;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 6px;
    border-radius: 4px;
    font-size: 0.75em;
    white-space: pre-wrap;
    z-index: 10;
}
</style>