<template>
  <div :class="{ 'wx-browser': isWeChat }">
    <!-- 微信引导浮层 -->
    <WeChatGuide :visible="showWeChatGuide" @dismiss="showWeChatGuide = false" />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>{{ loadingText }}</p>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="error-screen">
      <p>😵 题库加载失败</p>
      <p class="error-detail">{{ loadError }}</p>
      <button class="btn btn-main" @click="retryLoad">重试</button>
    </div>

    <!-- 正常模式 -->
    <div v-else class="container">
      <div :class="{ 'normal-mode': currentView !== 'practice', hidden: currentView === 'practice' }">
        <!-- 顶部 Header -->
        <div class="header">
          <h1>
            📚 项目管理题库 <span style="font-size: 12px; color: #999; font-weight: 400;">H5</span>
          </h1>

          <!-- 题库切换 -->
          <BankTabs
            :current-bank="currentBank"
            :bank-list="bankList"
            :bank-counts="bankCounts"
            @switch="switchBank"
          />

          <!-- 题型筛选 -->
          <QuestionTypeTabs
            :type-counts="typeCounts"
            :current-type="currentType"
            @change="setType"
          />

          <!-- 分类筛选 -->
          <CategoryTabs
            :categories="categories"
            :current-category="currentCategory"
            @change="setCategory"
          />

          <!-- 统计条 -->
          <StatsBar
            :current-index="currentIndex"
            :total-count="filteredQuestions.length"
            :correct-count="correctCount"
            :wrong-count="wrongCount"
          />
        </div>

        <!-- 视图切换标签 -->
        <div class="view-tabs">
          <button
            class="view-tab"
            :class="{ active: currentView === 'quiz' }"
            @click="currentView = 'quiz'"
          >
            📝 答题
          </button>
          <button
            class="view-tab"
            :class="{ active: currentView === 'wrongbook' }"
            @click="currentView = 'wrongbook'"
          >
            📝 错题本 <span v-if="wrongBook.length > 0" style="color: #f44336;">({{ wrongBook.length }})</span>
          </button>
          <button
            class="view-tab"
            :class="{ active: currentView === 'history' }"
            @click="currentView = 'history'"
          >
            📋 历史
          </button>
          <button
            class="view-tab"
            :class="{ active: currentView === 'scores' }"
            @click="currentView = 'scores'"
          >
            🏆 成绩
          </button>
        </div>

        <!-- 答题视图 -->
        <template v-if="currentView === 'quiz'">
          <!-- 选题面板 -->
          <div style="margin-bottom: 15px;">
            <QuestionGrid
              :questions="filteredQuestions"
              :question-states="questionStates"
              :favorites="favorites"
              :current-index="currentIndex"
              @jump="jumpTo"
            />
          </div>

          <!-- 题目卡片 -->
          <QuestionCard
            v-if="currentQuestion"
            :question="currentQuestion"
            :index="currentIndex"
            :submitted="submitted"
            :selected-answers="selectedAnswers"
            :is-favorite="favorites.has(currentQuestion._originalIndex)"
            @select="handleSelect"
            @submit="handleSubmit"
            @favorite="toggleFavorite"
            @redo="redoQuestion"
            @next="nextQuestion"
          />
        </template>

        <!-- 错题本视图 -->
        <WrongBook
          v-if="currentView === 'wrongbook'"
          :wrong-book="wrongBook"
          @practice="startWrongPractice"
          @mastered="markMastered"
          @clear="clearWrongBook"
        />

        <!-- 历史视图 -->
        <HistoryPanel
          v-if="currentView === 'history'"
          :history="history"
          @clear="clearHistory"
        />

        <!-- 成绩视图 -->
        <ScoreHistory
          v-if="currentView === 'scores'"
          :score-history="scoreHistory"
          @clear="clearScoreHistory"
        />
      </div>

      <!-- 错题练习模式 -->
      <div class="practice-mode" :class="{ active: currentView === 'practice' }">
        <div class="practice-stats">
          <span class="practice-progress">
            错题练习进度: <strong>{{ practiceIndex + 1 }}</strong> / <strong>{{ practiceQuestions.length }}</strong>
          </span>
          <button class="btn btn-clear" @click="exitPractice">退出错题练习</button>
        </div>
        <QuestionCard
          v-if="practiceCurrentQuestion"
          :question="practiceCurrentQuestion"
          :index="practiceIndex"
          :submitted="practiceSubmitted"
          :selected-answers="practiceSelectedAnswers"
          :is-favorite="false"
          @select="handlePracticeSelect"
          @submit="handlePracticeSubmit"
          @redo="redoPracticeQuestion"
          @next="nextPracticeQuestion"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { isWeChatBrowser } from './utils/helpers.js'
import { checkAnswer } from './utils/answerParser.js'
import { loadManifest, loadQuizBank } from './utils/quizLoader.js'
import BankTabs from './components/BankTabs.vue'
import QuestionCard from './components/QuestionCard.vue'
import QuestionTypeTabs from './components/QuestionTypeTabs.vue'
import CategoryTabs from './components/CategoryTabs.vue'
import StatsBar from './components/StatsBar.vue'
import QuestionGrid from './components/QuestionGrid.vue'
import WrongBook from './components/WrongBook.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import ScoreHistory from './components/ScoreHistory.vue'
import WeChatGuide from './components/WeChatGuide.vue'

// ====== 加载状态 ======
const loading = ref(true)
const loadingText = ref('正在加载题库…')
const loadError = ref(null)

// ====== 题库数据（运行时动态加载） ======
const pmQuestions = ref([])
const pmpQuestions = ref([])
const bankList = ref([])
const bankCounts = ref({})

// ====== 状态 ======
const currentBank = ref('pm')
const currentType = ref('all')
const currentCategory = ref('全部')
const currentIndex = ref(0)
const currentView = ref('quiz')
const submitted = ref(false)
const selectedAnswers = ref([])
const isCorrect = ref(false)
const questionStates = ref({})
const favorites = ref(new Set())
const wrongBook = ref([])
const history = ref([])
const scoreHistory = ref([])
const showWeChatGuide = ref(false)

// ====== 计算属性 ======
const allQuestions = computed(() => {
  const data = currentBank.value === 'pm' ? pmQuestions.value : pmpQuestions.value
  return data.map((q, i) => ({ ...q, _originalIndex: i }))
})

const filteredQuestions = computed(() => {
  let list = allQuestions.value
  if (currentType.value !== 'all') {
    list = list.filter(q => q.type === currentType.value)
  }
  if (currentCategory.value !== '全部') {
    list = list.filter(q => q.category === currentCategory.value)
  }
  return list
})

const currentQuestion = computed(() => filteredQuestions.value[currentIndex.value] || null)

const categories = computed(() => {
  const cats = new Set(allQuestions.value.map(q => q.category))
  return ['全部', ...cats]
})

const typeCounts = computed(() => {
  const list = currentCategory.value !== '全部'
    ? allQuestions.value.filter(q => q.category === currentCategory.value)
    : allQuestions.value
  return {
    all: list.length,
    single: list.filter(q => q.type === 'single').length,
    multi: list.filter(q => q.type === 'multi').length,
    judge: list.filter(q => q.type === 'judge').length,
    fill: list.filter(q => q.type === 'fill').length
  }
})

const correctCount = computed(() => Object.values(questionStates.value).filter(v => v === true).length)
const wrongCount = computed(() => Object.values(questionStates.value).filter(v => v === false).length)

// ====== 错题练习状态 ======
const practiceQuestions = ref([])
const practiceIndex = ref(0)
const practiceSubmitted = ref(false)
const practiceSelectedAnswers = ref([])
const practiceIsCorrect = ref(false)

const practiceCurrentQuestion = computed(() => practiceQuestions.value[practiceIndex.value] || null)

// ====== 微信检测 ======
const isWeChat = isWeChatBrowser()

// ====== 数据加载 ======
async function loadAllBanks() {
  loading.value = true
  loadError.value = null
  try {
    loadingText.value = '正在获取题库清单…'
    const manifest = await loadManifest()
    bankList.value = manifest.banks
    const counts = {}
    for (const b of manifest.banks) {
      counts[b.id] = b.total
    }
    bankCounts.value = counts

    // 预加载默认题库
    loadingText.value = '正在加载项目管理大赛题库…'
    const pmData = await loadQuizBank('pm')
    pmQuestions.value = pmData.questions

    loadingText.value = '正在加载 PMP 题库…'
    const pmpData = await loadQuizBank('pmp')
    pmpQuestions.value = pmpData.questions

    // 检查 URL 参数自动切换题库
    const params = new URLSearchParams(window.location.search)
    const bankParam = params.get('bank')
    if (bankParam && bankList.value.some(b => b.id === bankParam)) {
      currentBank.value = bankParam
    }

    loading.value = false
  } catch (e) {
    loadError.value = e.message || '未知错误'
    loading.value = false
  }
}

async function retryLoad() {
  await loadAllBanks()
}

// ====== 方法 ======
function switchBank(bank) {
  currentBank.value = bank
  currentIndex.value = 0
  submitted.value = false
  selectedAnswers.value = []
  currentType.value = 'all'
  currentCategory.value = '全部'
}

function setType(type) {
  currentType.value = type
  currentIndex.value = 0
  submitted.value = false
  selectedAnswers.value = []
}

function setCategory(cat) {
  currentCategory.value = cat
  currentIndex.value = 0
  submitted.value = false
  selectedAnswers.value = []
}

function jumpTo(originalIndex) {
  const idx = filteredQuestions.value.findIndex(q => q._originalIndex === originalIndex)
  if (idx >= 0) {
    currentIndex.value = idx
    submitted.value = false
    selectedAnswers.value = []
  }
}

function handleSelect(answer) {
  const q = currentQuestion.value
  if (!q || submitted.value) return
  if (q.type === 'multi') {
    const idx = selectedAnswers.value.indexOf(answer)
    if (idx >= 0) {
      selectedAnswers.value.splice(idx, 1)
    } else {
      selectedAnswers.value.push(answer)
    }
  } else {
    selectedAnswers.value = [answer]
    handleSubmit()
  }
}

function handleSubmit(fillValue) {
  const q = currentQuestion.value
  if (!q || submitted.value) return
  submitted.value = true

  const result = checkAnswer(q, selectedAnswers.value)
  isCorrect.value = result.isCorrect

  const userAnswer = selectedAnswers.value.join('')
  addHistory(q, isCorrect.value, userAnswer)

  if (q.type !== 'fill') {
    questionStates.value[q._originalIndex] = isCorrect.value
  }

  if (isCorrect.value === false) {
    addToWrongBook(q)
  }
}

function addHistory(q, correct, userAnswer) {
  const now = new Date()
  const time = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  history.value.unshift({ q: q.q, isCorrect: correct, time, type: q.type, answer: q.answer, userAnswer })
  if (history.value.length > 100) history.value.pop()
  saveState()
}

function nextQuestion() {
  if (currentIndex.value < filteredQuestions.value.length - 1) {
    currentIndex.value++
    submitted.value = false
    selectedAnswers.value = []
  }
}

function redoQuestion() {
  submitted.value = false
  selectedAnswers.value = []
  isCorrect.value = false
}

function toggleFavorite() {
  const q = currentQuestion.value
  if (!q) return
  if (favorites.value.has(q._originalIndex)) {
    favorites.value.delete(q._originalIndex)
  } else {
    favorites.value.add(q._originalIndex)
  }
  favorites.value = new Set(favorites.value)
  saveState()
}

function addToWrongBook(q) {
  const idx = wrongBook.value.findIndex(w => w.q === q.q)
  if (idx >= 0) {
    wrongBook.value[idx].count++
    wrongBook.value[idx].time = new Date().toLocaleString('zh-CN')
  } else {
    wrongBook.value.unshift({
      q: q.q,
      answer: q.answer,
      explain: q.explain,
      type: q.type,
      options: q.options,
      count: 1,
      time: new Date().toLocaleString('zh-CN')
    })
  }
  saveState()
}

function markMastered(idx) {
  wrongBook.value.splice(idx, 1)
  saveState()
}

function clearWrongBook() {
  wrongBook.value = []
  saveState()
}

function clearHistory() {
  history.value = []
  saveState()
}

function clearScoreHistory() {
  scoreHistory.value = []
  saveState()
}

// ====== 错题练习 ======
function startWrongPractice() {
  if (wrongBook.value.length === 0) return
  practiceQuestions.value = wrongBook.value.map((w, i) => ({ ...w, _originalIndex: i }))
  practiceIndex.value = 0
  practiceSubmitted.value = false
  practiceSelectedAnswers.value = []
  practiceIsCorrect.value = false
  currentView.value = 'practice'
}

function handlePracticeSelect(answer) {
  const q = practiceCurrentQuestion.value
  if (!q || practiceSubmitted.value) return
  if (q.type === 'multi') {
    const idx = practiceSelectedAnswers.value.indexOf(answer)
    if (idx >= 0) {
      practiceSelectedAnswers.value.splice(idx, 1)
    } else {
      practiceSelectedAnswers.value.push(answer)
    }
  } else {
    practiceSelectedAnswers.value = [answer]
  }
}

function handlePracticeSubmit(fillValue) {
  const q = practiceCurrentQuestion.value
  if (!q || practiceSubmitted.value) return
  practiceSubmitted.value = true

  if (q.type === 'fill') {
    practiceIsCorrect.value = fillValue && fillValue.trim() === q.answer.trim()
  } else {
    const userAnswer = [...practiceSelectedAnswers.value].sort().join('')
    const correctAnswer = q.answer.split('').filter(c => /[A-H]/.test(c)).sort().join('')
    practiceIsCorrect.value = userAnswer === correctAnswer
  }

  if (practiceIsCorrect.value) {
    const wbIdx = wrongBook.value.findIndex(w => w.q === q.q)
    if (wbIdx >= 0) wrongBook.value.splice(wbIdx, 1)
  } else {
    const wbIdx = wrongBook.value.findIndex(w => w.q === q.q)
    if (wbIdx >= 0) {
      wrongBook.value[wbIdx].count++
      wrongBook.value[wbIdx].time = new Date().toLocaleString('zh-CN')
    }
  }
  saveState()
}

function nextPracticeQuestion() {
  if (practiceIndex.value < practiceQuestions.value.length - 1) {
    practiceIndex.value++
    practiceSubmitted.value = false
    practiceSelectedAnswers.value = []
  }
}

function redoPracticeQuestion() {
  practiceSubmitted.value = false
  practiceSelectedAnswers.value = []
  practiceIsCorrect.value = false
}

function exitPractice() {
  currentView.value = 'wrongbook'
}

// ====== 持久化 ======
const STORAGE_KEY = 'quiz-vue-state'

function saveState() {
  const state = {
    currentBank: currentBank.value,
    questionStates: questionStates.value,
    favorites: [...favorites.value],
    wrongBook: wrongBook.value,
    history: history.value,
    scoreHistory: scoreHistory.value
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) { /* ignore */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const state = JSON.parse(raw)
    if (state.currentBank) currentBank.value = state.currentBank
    if (state.questionStates) questionStates.value = state.questionStates
    if (state.favorites) favorites.value = new Set(state.favorites)
    if (state.wrongBook) wrongBook.value = state.wrongBook
    if (state.history) history.value = state.history
    if (state.scoreHistory) scoreHistory.value = state.scoreHistory
  } catch (e) { /* ignore */ }
}

// ====== 初始化 ======
onMounted(async () => {
  loadState()
  await loadAllBanks()
  if (isWeChat) {
    const dismissed = sessionStorage.getItem('wxGuideDismissed')
    if (!dismissed) showWeChatGuide.value = true
  }
})
</script>

<style>
/* ====== 加载 / 错误状态（内联到组件确保一定打包） ====== */
.loading-screen { text-align: center; padding: 80px 20px; color: #666; }
.loading-spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #1976d2; border-radius: 50%; animation: quizSpin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes quizSpin { to { transform: rotate(360deg); } }
.loading-screen p { font-size: 15px; }
.error-screen { text-align: center; padding: 80px 20px; color: #666; }
.error-screen p { font-size: 18px; margin-bottom: 8px; }
.error-detail { font-size: 13px !important; color: #999; margin-bottom: 16px !important; }
.error-screen .btn-main { margin-top: 16px; padding: 10px 32px; background: #1976d2; color: #fff; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; }
</style>
