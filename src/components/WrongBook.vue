<template>
  <div class="wrong-book-section">
    <div class="wrong-book-header">
      <div class="wrong-book-title">
        📝 错题本
        <span class="wrong-book-badge">{{ wrongBook.length }}</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button
          v-if="wrongBook.length > 0"
          class="btn btn-practice"
          @click="$emit('practice')"
        >
          错题练习
        </button>
        <button
          v-if="wrongBook.length > 0"
          class="btn btn-clear"
          @click="$emit('clear')"
        >
          清空错题本
        </button>
      </div>
    </div>

    <div v-if="wrongBook.length === 0" class="empty-history">暂无错题记录</div>

    <div v-else class="wrong-book-list">
      <div v-for="(item, idx) in wrongBook" :key="idx" class="wrong-item">
        <div class="wrong-item-header">
          <div class="wrong-item-info">
            <div class="wrong-item-q">{{ item.q }}</div>
            <div class="wrong-item-meta">
              错误 {{ item.count }} 次 &nbsp;|&nbsp; {{ item.time }}
            </div>
          </div>
          <div class="wrong-item-actions">
            <button class="btn-mastered" @click="$emit('mastered', idx)">已掌握</button>
          </div>
        </div>
        <div v-if="item.explain" class="wrong-item-explain">{{ item.explain }}</div>
        <div class="wrong-item-answer">
          正确答案：<strong>{{ item.answer }}</strong>
          <template v-if="item.userAnswer">
            &nbsp;|&nbsp; 你的答案：<span>{{ item.userAnswer }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  wrongBook: { type: Array, default: () => [] }
})
defineEmits(['practice', 'remove', 'mastered', 'clear'])
</script>
