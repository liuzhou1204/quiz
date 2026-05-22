<script setup>
import { computed, ref } from 'vue'
import { checkAnswer } from '../utils/answerParser.js'
import { getQuestionId } from '../utils/helpers.js'

const props = defineProps({
  question: Object,
  submitted: Boolean,
  selectedAnswers: Array,
  isFavorite: Boolean,
  index: { type: Number, default: 0 },
})

const emit = defineEmits(['select', 'submit', 'next', 'redo', 'favorite'])

// Answer result (computed after submission)
const result = computed(() => {
  if (!props.submitted || !props.question) return null
  return checkAnswer(props.question, props.selectedAnswers)
})

// Show submit button for multi-select when >= 2 selected
const showSubmitBtn = computed(() => {
  return props.question?.type === 'multi' && props.selectedAnswers.length >= 2 && !props.submitted
})

// Fill input
const fillInput = ref('')
const showFillResult = computed(() => props.question?.type === 'fill' && fillInput.value !== '' && props.submitted)

function getTypeLabel(type) {
  const map = { single: '单选题', multi: '多选题', judge: '判断题', fill: '填空题' }
  return map[type] || type
}

function getTypeClass(type) {
  return `type-${type}`
}

function handleOptionClick(key) {
  if (props.submitted) return
  emit('select', key)
}

function handleFillKeydown(e) {
  if (e.key === 'Enter' && fillInput.value.trim()) {
    emit('select', fillInput.value.trim())
  }
}

function handleJudgeClick(value) {
  if (props.submitted) return
  emit('select', value)
}

// Parse answer for display
const correctAnswerDisplay = computed(() => {
  if (!props.question) return ''
  const q = props.question
  if (q.type === 'fill') return q.answer
  if (q.type === 'judge') return q.answer
  // single/multi: show option text
  if (!q.options) return q.answer
  const letters = q.answer.replace(/\s/g, '')
  const isContinuous = /^[A-Z]{2,}$/i.test(letters)
  let answerLetters
  if (isContinuous) {
    answerLetters = letters.toUpperCase().split('')
  } else {
    answerLetters = letters.split(',').map(s => s.trim().toUpperCase())
  }
  return answerLetters.map(letter => {
    const idx = letter.charCodeAt(0) - 65
    return `${letter}. ${q.options[idx] || letter}`
  }).join('  ')
})
</script>

<template>
  <div class="question-card" v-if="question">
    <!-- Header -->
    <div class="question-header">
      <span class="question-num">第 {{ index + 1 }} 题</span>
      <div class="question-meta">
        <span class="question-type" :class="getTypeClass(question.type)">
          {{ getTypeLabel(question.type) }}
        </span>
        <span class="category-tag">{{ question.category }}</span>
        <button class="fav-btn" :class="{ active: isFavorite }"
                @click="$emit('favorite')" title="收藏此题">
          {{ isFavorite ? '★' : '☆' }}
        </button>
      </div>
    </div>

    <!-- Question Text -->
    <div class="question-text">{{ question.q }}</div>

    <!-- Single/Multi Options -->
    <div v-if="question.type === 'single' || question.type === 'multi'" class="options">
      <div v-if="question.type === 'multi' && !submitted"
           class="multi-hint">
        💡 多选题，请选择所有正确答案
      </div>
      <div v-for="(opt, i) in question.options" :key="i"
           class="option"
           :class="{
             selected: selectedAnswers.includes(String.fromCharCode(65 + i)) && !submitted,
             correct: submitted && result && result.correctAnswer.has(String.fromCharCode(65 + i)) && result.isCorrect,
             wrong: submitted && result && !result.isCorrect && selectedAnswers.includes(String.fromCharCode(65 + i)),
             missed: submitted && result && !result.isCorrect && result.correctAnswer.has(String.fromCharCode(65 + i)) && !selectedAnswers.includes(String.fromCharCode(65 + i)),
             disabled: submitted
           }"
           @click="handleOptionClick(String.fromCharCode(65 + i))">
        <span class="option-key">{{ String.fromCharCode(65 + i) }}</span>
        <span class="option-text">{{ opt }}</span>
      </div>
    </div>

    <!-- Judge Options -->
    <div v-if="question.type === 'judge'" class="judge-buttons">
      <div class="judge-btn"
           :class="{
             selected: selectedAnswers.includes('正确') && !submitted,
             correct: submitted && result && result.isCorrect && selectedAnswers.includes('正确'),
             wrong: submitted && result && !result.isCorrect && selectedAnswers.includes('正确'),
             disabled: submitted
           }"
           @click="handleJudgeClick('正确')">
        ✅ 正确
      </div>
      <div class="judge-btn"
           :class="{
             selected: selectedAnswers.includes('错误') && !submitted,
             correct: submitted && result && result.isCorrect && selectedAnswers.includes('错误'),
             wrong: submitted && result && !result.isCorrect && selectedAnswers.includes('错误'),
             disabled: submitted
           }"
           @click="handleJudgeClick('错误')">
        ❌ 错误
      </div>
    </div>

    <!-- Fill Input -->
    <div v-if="question.type === 'fill'" class="fill-input-wrapper">
      <input class="fill-input"
             v-model="fillInput"
             :placeholder="submitted ? '' : '请输入你的答案，回车查看参考答案'"
             :readonly="submitted"
             @keydown="handleFillKeydown" />
    </div>

    <!-- Buttons -->
    <div class="btn-group">
      <button v-if="showSubmitBtn" class="btn btn-submit" @click="$emit('submit')">
        确认提交
      </button>
      <button v-if="submitted" class="btn btn-next" @click="$emit('next')">
        下一题
      </button>
      <button class="btn btn-reset" @click="$emit('redo')">
        重做本题
      </button>
    </div>

    <!-- Explain Box -->
    <div v-if="submitted && result" class="explain-box"
         :class="{
           'explain-correct': result.isCorrect === true,
           'explain-wrong': result.isCorrect === false,
           'explain-reference': result.isCorrect === null
         }">
      <div class="explain-title">
        <template v-if="result.isCorrect === true">✅ 回答正确！</template>
        <template v-else-if="result.isCorrect === false">❌ 回答错误</template>
        <template v-else>📝 参考答案</template>
      </div>
      <div class="your-answer">
        <strong>正确答案：</strong>{{ correctAnswerDisplay }}
      </div>
      <div v-if="question.explain" class="explain-content">{{ question.explain }}</div>
    </div>
  </div>
</template>
