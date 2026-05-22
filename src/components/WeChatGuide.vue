<template>
  <div v-if="visible" class="open-in-browser-mask show">
    <div class="arrow">↗️</div>
    <div class="tip">点击右上角 ···</div>
    <div class="sub">选择「在浏览器打开」体验更佳</div>
    <div class="sub" style="margin-top: 30px; opacity: 0.5; font-size: 12px; cursor: pointer;" @click="$emit('dismiss')">
      仍在此处继续 →
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false }
})
defineEmits(['dismiss'])
</script>
