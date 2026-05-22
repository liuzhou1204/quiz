<template>
  <div class="type-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.type"
      class="type-tab"
      :class="{ active: currentType === tab.type }"
      @click="$emit('change', tab.type)"
    >
      {{ tab.label }}<span class="tab-count">({{ tab.count }})</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  typeCounts: { type: Object, default: () => ({}) },
  currentType: { type: String, default: 'all' }
})
defineEmits(['change'])

const tabs = computed(() => [
  { type: 'all', label: '全部', count: props.typeCounts.all || 0 },
  { type: 'single', label: '单选', count: props.typeCounts.single || 0 },
  { type: 'multi', label: '多选', count: props.typeCounts.multi || 0 },
  { type: 'judge', label: '判断', count: props.typeCounts.judge || 0 },
  { type: 'fill', label: '填空', count: props.typeCounts.fill || 0 }
])
</script>
