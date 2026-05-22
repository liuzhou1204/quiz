/**
 * useQuiz composable - 核心答题逻辑
 */
import { ref, computed, watch } from 'vue'
import { checkAnswer } from '../utils/answerParser.js'
import { useLocalStorage } from './useLocalStorage.js'
import { getQuestionId } from '../utils/helpers.js'

export function useQuiz(bankQuestions, currentBank) {
  // 筛选条件
  const currentType = ref('all')     // all | single | multi | judge | fill
  const currentCategory = ref('全部')

  // 过滤后的题目列表
  const filteredQuestions = computed(() => {
    let questions = bankQuestions.value

    // 按类型筛选
    if (currentType.value !== 'all') {
      questions = questions.filter(q => q.type === currentType.value)
    }

    // 按分类筛选
    if (currentCategory.value !== '全部') {
      questions = questions.filter(q => q.category === currentCategory.value)
    }

    return questions
  })

  // 当前题目索引
  const currentIndex = ref(0)

  // 是否已提交
  const submitted = ref(false)

  // 当前选中的答案
  const selectedAnswers = ref([])

  // 题目状态持久化（按题库隔离）
  const storageKey = computed(() => `${currentBank.value}_quizStates`)
  const questionStates = useLocalStorage(storageKey.value, {})

  // 切换题库时重置状态
  watch(currentBank, (newBank) => {
    const saved = localStorage.getItem(`${newBank}_quizStates`)
    questionStates.value = saved ? JSON.parse(saved) : {}
    currentIndex.value = 0
    submitted.value = false
    selectedAnswers.value = []
  })

  // 切换筛选时重置索引
  watch([currentType, currentCategory], () => {
    currentIndex.value = 0
    submitted.value = false
    selectedAnswers.value = []
  })

  // 当前题目
  const currentQuestion = computed(() => {
    const list = filteredQuestions.value
    if (list.length === 0) return null
    return list[currentIndex.value] || null
  })

  // 当前题目ID
  const currentQuestionId = computed(() => {
    if (!currentQuestion.value) return null
    return getQuestionId(currentQuestion.value)
  })

  // 统计
  const correctCount = computed(() => {
    return Object.values(questionStates.value).filter(s => s === 'correct').length
  })

  const wrongCount = computed(() => {
    return Object.values(questionStates.value).filter(s => s === 'wrong').length
  })

  // 选择选项
  function selectOption(key) {
    if (submitted.value) return
    const q = currentQuestion.value
    if (!q) return

    if (q.type === 'single' || q.type === 'judge') {
      // 单选/判断：直接替换并自动提交
      selectedAnswers.value = [key]
      submitAnswer()
    } else if (q.type === 'multi') {
      // 多选：切换选择状态
      const idx = selectedAnswers.value.indexOf(key)
      if (idx > -1) {
        selectedAnswers.value.splice(idx, 1)
      } else {
        selectedAnswers.value.push(key)
      }
    } else if (q.type === 'fill') {
      // 填空：直接设置值
      selectedAnswers.value = [key]
    }
  }

  // 提交答案
  function submitAnswer() {
    if (!currentQuestion.value || selectedAnswers.value.length === 0) return

    const result = checkAnswer(currentQuestion.value, selectedAnswers.value)
    const qId = currentQuestionId.value

    if (result.isCorrect === null) {
      // 填空题：标记为已提交但不计入统计
      submitted.value = true
      return
    }

    // 保存状态
    questionStates.value[qId] = result.isCorrect ? 'correct' : 'wrong'
    submitted.value = true
  }

  // 下一题
  function nextQuestion() {
    if (currentIndex.value < filteredQuestions.value.length - 1) {
      currentIndex.value++
      submitted.value = false
      selectedAnswers.value = []
    }
  }

  // 重做本题
  function redoQuestion() {
    submitted.value = false
    selectedAnswers.value = []
  }

  // 跳转到指定题
  function jumpTo(index) {
    if (index >= 0 && index < filteredQuestions.value.length) {
      currentIndex.value = index
      submitted.value = false
      selectedAnswers.value = []
    }
  }

  // 重置所有作答状态
  function clearStates() {
    questionStates.value = {}
    currentIndex.value = 0
    submitted.value = false
    selectedAnswers.value = []
  }

  return {
    currentType,
    currentCategory,
    filteredQuestions,
    currentIndex,
    submitted,
    selectedAnswers,
    questionStates,
    currentQuestion,
    correctCount,
    wrongCount,
    selectOption,
    submitAnswer,
    nextQuestion,
    redoQuestion,
    jumpTo,
    clearStates,
  }
}
