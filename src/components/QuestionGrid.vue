<script setup>
import { computed } from 'vue'

const props = defineProps({
  questions: Array,
  questionStates: Object,
  favorites: Object,
  currentIndex: Number,
})

const emit = defineEmits(['jump'])

const tiles = computed(() => {
  return props.questions.map((q, i) => {
    const state = props.questionStates[i] || 'unanswered'
    const fav = props.favorites.has ? props.favorites.has(i) : false
    const isCurrent = i === props.currentIndex
    return { index: i, state, fav, isCurrent, q }
  })
})

const stats = computed(() => {
  const total = tiles.value.length
  const answered = tiles.value.filter(t => t.state !== 'unanswered')
  const correct = tiles.value.filter(t => t.state === 'correct')
  return { total, answered: answered.length, correct: correct.length }
})
</script>

<template>
  <div>
    <div style="margin-bottom: 8px; font-size: 12px; color: #999;">
      已答 {{ stats.answered }}/{{ stats.total }}
      <span v-if="stats.answered > 0">
        &nbsp;正确率 {{ Math.round(stats.correct / stats.answered * 100) }}%
      </span>
    </div>
    <div class="picker-grid">
      <div
        v-for="tile in tiles"
        :key="tile.index"
        class="picker-tile"
        :class="{
          current: tile.isCurrent,
          correct: tile.state === 'correct',
          wrong: tile.state === 'wrong',
          fav: tile.fav
        }"
        :title="tile.q.q ? tile.q.q.substring(0, 40) : ''"
        @click="emit('jump', tile.index)"
      >
        {{ tile.index + 1 }}
      </div>
    </div>
  </div>
</template>
