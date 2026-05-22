<template>
  <div class="category-tabs">
    <button
      v-for="cat in categories"
      :key="cat"
      class="category-tab"
      :class="{ active: currentCategory === cat }"
      @click="$emit('change', cat)"
    >
      {{ cat }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  categories: { type: Array, default: () => [] },
  currentCategory: { type: String, default: '全部' }
})
defineEmits(['change'])
</script>
