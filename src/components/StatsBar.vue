<template>
  <div class="stats">
    <div class="stat">
      <div class="stat-label">进度</div>
      <div class="stat-value">{{ currentIndex + 1 }}/{{ totalCount }}</div>
    </div>
    <div class="stat correct">
      <div class="stat-label">答对</div>
      <div class="stat-value">{{ correctCount }}</div>
    </div>
    <div class="stat wrong">
      <div class="stat-label">答错</div>
      <div class="stat-value">{{ wrongCount }}</div>
    </div>
    <div class="stat">
      <div class="stat-label">正确率</div>
      <div class="stat-value">{{ accuracy }}%</div>
    </div>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" :style="{ width: progress + '%' }"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentIndex: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 }
})

const accuracy = computed(() => {
  const total = props.correctCount + props.wrongCount
  if (total === 0) return 0
  return Math.round((props.correctCount / total) * 100)
})

const progress = computed(() => {
  if (props.totalCount === 0) return 0
  return Math.round(((props.currentIndex + 1) / props.totalCount) * 100)
})
</script>
