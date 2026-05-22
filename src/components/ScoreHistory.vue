<template>
  <div class="score-history-section">
    <div class="score-history-header">
      <div class="score-history-title">🏆 历史成绩</div>
      <button v-if="scoreHistory.length > 0" class="btn btn-clear" @click="$emit('clear')">清空成绩</button>
    </div>

    <!-- 摘要统计 -->
    <div v-if="scoreHistory.length > 0" class="score-summary">
      <div class="score-summary-card">
        <div class="score-summary-label">总练习次数</div>
        <div class="score-summary-value highlight">{{ scoreHistory.length }}</div>
      </div>
      <div class="score-summary-card">
        <div class="score-summary-label">累计答对</div>
        <div class="score-summary-value" style="color: #4caf50;">{{ totalCorrect }}</div>
      </div>
      <div class="score-summary-card">
        <div class="score-summary-label">累计答错</div>
        <div class="score-summary-value" style="color: #f44336;">{{ totalWrong }}</div>
      </div>
      <div class="score-summary-card">
        <div class="score-summary-label">平均正确率</div>
        <div class="score-summary-value">{{ avgAccuracy }}%</div>
      </div>
      <div class="score-summary-card">
        <div class="score-summary-label">最高正确率</div>
        <div class="score-summary-value" style="color: #ff9800;">{{ bestAccuracy }}%</div>
      </div>
    </div>

    <!-- 成绩列表 -->
    <div v-if="scoreHistory.length === 0" class="empty-scores">暂无练习记录，开始做题吧！</div>

    <div v-else class="score-list">
      <div v-for="(item, idx) in scoreHistory" :key="idx" class="score-item">
        <div class="score-item-header">
          <div class="score-item-info">
            <span class="score-item-date">{{ item.date }}</span>
            <span v-if="item.filter" class="score-item-filter">{{ item.filter }}</span>
          </div>
          <span class="score-item-result" :style="{ color: item.rate >= 60 ? '#4caf50' : '#f44336' }">
            {{ item.rate }}%
          </span>
        </div>
        <div class="score-item-details">
          <span class="score-detail correct">✓ {{ item.correct }}</span>
          <span class="score-detail wrong">✗ {{ item.wrong }}</span>
          <span class="score-detail rate">共 {{ item.total }} 题</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  scoreHistory: { type: Array, default: () => [] }
})
defineEmits(['clear'])

const totalCorrect = computed(() => props.scoreHistory.reduce((s, i) => s + i.correct, 0))
const totalWrong = computed(() => props.scoreHistory.reduce((s, i) => s + i.wrong, 0))
const avgAccuracy = computed(() => {
  if (props.scoreHistory.length === 0) return 0
  const total = totalCorrect.value + totalWrong.value
  if (total === 0) return 0
  return Math.round((totalCorrect.value / total) * 100)
})
const bestAccuracy = computed(() => {
  if (props.scoreHistory.length === 0) return 0
  return Math.max(...props.scoreHistory.map(i => i.rate))
})
</script>
