<template>
  <div>
    <!-- 多选提示 -->
    <div v-if="type === 'multi' && !submitted" class="multi-hint">
      ⚠ 多选题：选择两个或以上选项后提交
    </div>

    <!-- 选项列表 -->
    <div class="options">
      <div
        v-for="(opt, idx) in options"
        :key="idx"
        class="option"
        :class="optionClass(idx)"
        @click="handleClick(idx)"
      >
        <span class="option-key">{{ optionKeys[idx] }}</span>
        <span class="option-text">{{ opt }}</span>
      </div>
    </div>

    <!-- 多选提交按钮 -->
    <div v-if="type === 'multi' && !submitted && selectedAnswers.length >= 2" class="btn-group" style="margin-top: 10px;">
      <button class="btn btn-submit" @click="$emit('submit')">确认提交</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  options: { type: Array, default: () => [] },
  submitted: { type: Boolean, default: false },
  selectedAnswers: { type: Array, default: () => [] },
  correctAnswer: { type: String, default: '' },
  isCorrect: { type: Boolean, default: false },
  type: { type: String, default: 'single' }
})

const emit = defineEmits(['select', 'submit'])

const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function getAnswerArray(answer) {
  return answer.split('').filter(c => /[A-H]/.test(c))
}

function optionClass(idx) {
  const key = optionKeys[idx]
  if (!props.submitted) {
    return props.selectedAnswers.includes(key) ? 'selected' : ''
  }

  const correctArr = getAnswerArray(props.correctAnswer)
  const isCorrectOption = correctArr.includes(key)
  const isSelected = props.selectedAnswers.includes(key)

  if (props.type === 'multi') {
    // 多选：选中的正确=绿色，选中的错误=红色，未选中的正确=橙色
    if (isSelected && isCorrectOption) return 'correct disabled'
    if (isSelected && !isCorrectOption) return 'wrong disabled'
    if (!isSelected && isCorrectOption) return 'missed disabled'
    return 'disabled'
  }

  // 单选
  if (isCorrectOption) return 'correct disabled'
  if (isSelected) return 'wrong disabled'
  return 'disabled'
}

function handleClick(idx) {
  if (props.submitted) return
  emit('select', optionKeys[idx])
}
</script>
