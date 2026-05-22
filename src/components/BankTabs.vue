<template>
  <div class="bank-tabs">
    <button
      v-for="bank in bankList"
      :key="bank.id"
      class="bank-tab"
      :class="{ active: currentBank === bank.id }"
      @click="$emit('switch', bank.id)"
    >
      🏦 {{ bank.name }} <span class="bank-count">({{ bankCounts[bank.id] || 0 }})</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  currentBank: { type: String, default: 'pm' },
  bankList: { type: Array, default: () => [] },
  bankCounts: { type: Object, default: () => ({}) }
})
defineEmits(['switch'])
</script>
