<template>
  <div class="history-section">
    <div class="history-header">
      <div class="history-title">📋 做题历史记录</div>
      <button v-if="history.length > 0" class="btn btn-clear" @click="$emit('clear')">清空历史</button>
    </div>

    <div v-if="history.length === 0" class="empty-history">暂无做题记录</div>

    <div v-else class="history-list">
      <div v-for="(item, idx) in displayHistory" :key="idx" class="history-item">
        <div class="history-info">
          <div class="history-q">{{ item.q }}</div>
          <div class="history-meta">{{ item.time }}</div>
        </div>
        <div class="history-result" :class="item.isCorrect ? 'result-correct' : 'result-wrong'">
          {{ item.isCorrect ? '✓ 正确' : '✗ 错误' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  history: { type: Array, default: () => [] }
})

defineEmits(['clear'])

const displayHistory = computed(() => props.history.slice(0, 50))
</script>
