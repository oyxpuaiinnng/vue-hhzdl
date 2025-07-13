<template>
    <div class="camp-panel">
        <CharacterCard v-for="(ch, idx) in party" :key="ch.id || idx" :character="ch" :selectable="selectable"
            :isSelected="currentActor === ch" @select="() => $emit('select', ch)" />
    </div>
</template>

<script setup>
import { defineProps } from 'vue';
import CharacterCard from './CharacterCard.vue';

const props = defineProps({
    party: { type: Array, required: true },
    isPlayerCamp: { type: Boolean, default: true },
    selectable: { type: Boolean, default: false },
    currentActor: { type: Object, default: null }
});
//console.log(party)
</script>

<style scoped>
.camp-panel {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
}
</style>