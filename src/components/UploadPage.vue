<template>
  <div class="upload-page">
    <div class="upload-header">
      <h2>创建新题库</h2>
      <p>上传文档（.docx / .pdf），自动解析为在线题库</p>
    </div>

    <!-- 模式选择（仅在未上传时显示） -->
    <div v-if="!questionsDoc && !parsed" class="mode-selector">
      <button class="mode-btn" :class="{ active: uploadMode === 'single' }" @click="uploadMode = 'single'">
        <span class="mode-icon">1</span>
        <span class="mode-label">单文档</span>
        <span class="mode-desc">题目和答案在同一文档</span>
      </button>
      <button class="mode-btn" :class="{ active: uploadMode === 'dual' }" @click="uploadMode = 'dual'">
        <span class="mode-icon">2</span>
        <span class="mode-label">双文档</span>
        <span class="mode-desc">题目和答案分开两个文档</span>
      </button>
    </div>

    <!-- 解析引擎选择 -->
    <div v-if="!questionsDoc && !parsed" class="engine-selector">
      <span class="engine-label">解析引擎</span>
      <button
        class="engine-btn"
        :class="{ active: parserEngine === 'rule' }"
        @click="parserEngine = 'rule'"
      >规则引擎</button>
      <button
        class="engine-btn"
        :class="{ active: parserEngine === 'ai' }"
        @click="parserEngine = 'ai'"
      >AI 识别</button>
      <span class="engine-hint" v-if="parserEngine === 'ai' && !hasApiKey">需要配置 API Key</span>
      <span class="engine-hint ok" v-else-if="parserEngine === 'ai'">GLM-4-Flash 免费</span>
      <span class="engine-hint ok" v-else>本地解析，无需联网</span>
    </div>

    <!-- API Key 配置提示 -->
    <div v-if="!questionsDoc && !parsed && parserEngine === 'ai' && !hasApiKey" class="apikey-notice">
      <span class="apikey-icon">🔑</span>
      <div>
        <strong>使用 AI 识别需要智谱 API Key（免费）</strong>
        <p>1. 访问 <a href="https://open.bigmodel.cn/" target="_blank">open.bigmodel.cn</a> 注册<br>2. 在 API 密钥页面复制 Key<br>3. 在下方输入框中粘贴</p>
      </div>
      <div class="apikey-input-row">
        <input v-model="apiKeyInput" type="password" placeholder="粘贴 API Key" class="apikey-input" @keyup.enter="saveApiKey" />
        <button class="btn btn-small" @click="saveApiKey" :disabled="!apiKeyInput.trim()">保存</button>
      </div>
    </div>

    <!-- ========= 单文档模式 ========= -->
    <template v-if="uploadMode === 'single'">
      <!-- Step 1: 上传区 -->
      <div v-if="!parsed" class="upload-section">
        <div
          class="drop-zone"
          :class="{ 'drag-over': dragging }"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input ref="fileInput" type="file" accept=".docx,.pdf" style="display: none" @change="handleFileSelect" />
          <div class="drop-icon">D</div>
          <p class="drop-title">拖拽 .docx / .pdf 文件到这里</p>
          <p class="drop-sub">或点击选择文件</p>
          <p class="drop-hint">题目和答案在同一文档中</p>
        </div>

        <div class="format-guide">
          <h4>支持的题目格式</h4>
          <div class="format-examples">
            <div class="format-item">
              <span class="format-badge single">单选</span>
              <code>1. 题干内容<br>A. 选项A<br>B. 选项B<br>C. 选项C<br>D. 选项D<br>答案: B</code>
            </div>
            <div class="format-item">
              <span class="format-badge multi">多选</span>
              <code>2. 以下哪些是正确的<br>A. 选项A<br>B. 选项B<br>C. 选项C<br>答案: A,B,C</code>
            </div>
            <div class="format-item">
              <span class="format-badge judge">判断</span>
              <code>3. 题干内容<br>答案: 正确</code>
            </div>
            <div class="format-item">
              <span class="format-badge fill">填空</span>
              <code>4. 题干____内容<br>答案: 关键词</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 文档大小警告 -->
      <div v-if="sizeWarning && !parsed && !parseError" class="size-warning">
        <span class="size-warn-icon">📄</span>
        <div class="size-warn-body">
          <strong>{{ sizeWarning }}</strong>
          <p>解析时间可能较长，且超出部分内容可能被截断。建议将文档拆分为多个小文件后分别上传。</p>
        </div>
        <button class="btn btn-secondary btn-small" @click="clearSizeWarning">我知道了</button>
      </div>

      <!-- 解析中 / 错误 -->
      <div v-if="parsing" class="parsing-section">
        <div class="loading-spinner"></div>
        <template v-if="parserEngine === 'ai'">
          <p>AI 正在识别题目…</p>
          <p class="parsing-sub">调用智谱 GLM-4-Flash，可能需要 10-30 秒</p>
        </template>
        <template v-else>
          <p>正在解析文档…</p>
          <p class="parsing-sub">正在提取文本并识别题目格式</p>
        </template>
      </div>

      <div v-if="parseError" class="error-section">
        <div class="error-icon">!</div>
        <h3>解析失败</h3>
        <p class="error-msg">{{ parseError }}</p>
        <button class="btn btn-main" @click="resetUpload">重新上传</button>
      </div>
    </template>

    <!-- ========= 双文档模式 ========= -->
    <template v-if="uploadMode === 'dual'">
      <!-- Phase 1: 上传题目文档 -->
      <div v-if="dualPhase === 'questions' && !parseError" class="upload-section">
        <div class="phase-steps">
          <span class="step active">1. 上传题目文档</span>
          <span class="step-arrow">→</span>
          <span class="step">2. 上传答案文档</span>
        </div>
        <div
          class="drop-zone"
          :class="{ 'drag-over': draggingQ }"
          @dragover.prevent="draggingQ = true"
          @dragleave.prevent="draggingQ = false"
          @drop.prevent="handleQuestionsDrop"
          @click="triggerQFileInput"
        >
          <input ref="qFileInput" type="file" accept=".docx,.pdf" style="display: none" @change="handleQuestionsFileSelect" />
          <div class="drop-icon">Q</div>
          <p class="drop-title">拖入题目文档</p>
          <p class="drop-sub">或点击选择 .docx / .pdf 文件</p>
          <p class="drop-hint">纯题目文档（可以不包含答案行）</p>
        </div>
      </div>

      <!-- 题目解析中 -->

      <!-- 文档大小警告 -->
      <div v-if="sizeWarning && !parsed && !parseError && dualPhase === 'questions'" class="size-warning">
        <span class="size-warn-icon">📄</span>
        <div class="size-warn-body">
          <strong>{{ sizeWarning }}</strong>
          <p>解析时间可能较长，且超出部分内容可能被截断。建议将文档拆分为多个小文件后分别上传。</p>
        </div>
        <button class="btn btn-secondary btn-small" @click="clearSizeWarning">我知道了</button>
      </div>

      <div v-if="parsingQ" class="parsing-section">
        <div class="loading-spinner"></div>
        <template v-if="parserEngine === 'ai'">
          <p>AI 正在识别题目…</p>
          <p class="parsing-sub">调用智谱 GLM-4-Flash，可能需要 10-30 秒</p>
        </template>
        <template v-else>
          <p>正在解析题目文档…</p>
          <p class="parsing-sub">提取题干、选项信息</p>
        </template>
      </div>

      <!-- Phase 2: 上传答案文档 -->
      <div v-if="dualPhase === 'answers'" class="upload-section">
        <div class="phase-steps">
          <span class="step done">1. 上传题目文档 ✓</span>
          <span class="step-arrow">→</span>
          <span class="step active">2. 上传答案文档</span>
        </div>
        <div class="q-summary">
          已解析 <strong>{{ questionsDoc.length }}</strong> 道题目，等待匹配答案
        </div>
        <div
          class="drop-zone answers-zone"
          :class="{ 'drag-over': draggingA }"
          @dragover.prevent="draggingA = true"
          @dragleave.prevent="draggingA = false"
          @drop.prevent="handleAnswersDrop"
          @click="triggerAFileInput"
        >
          <input ref="aFileInput" type="file" accept=".docx,.pdf" style="display: none" @change="handleAnswersFileSelect" />
          <div class="drop-icon">A</div>
          <p class="drop-title">拖入答案文档</p>
          <p class="drop-sub">或点击选择 .docx / .pdf 文件</p>
          <p class="drop-hint">支持格式：1.B / 1、B / 第1题 B / 1-5 BAC（批量）</p>
        </div>
        <button class="btn btn-secondary skip-btn" @click="skipAnswers">暂不匹配答案，直接预览</button>
      </div>

      <!-- 答案解析中 -->
      <div v-if="parsingA" class="parsing-section">
        <div class="loading-spinner"></div>
        <p>正在解析答案文档…</p>
        <p class="parsing-sub">按题号自动匹配</p>
      </div>

      <!-- 错误 -->
      <div v-if="parseError && uploadMode === 'dual'" class="error-section">
        <div class="error-icon">!</div>
        <h3>解析失败</h3>
        <p class="error-msg">{{ parseError }}</p>
        <button class="btn btn-secondary" @click="resetPhase" style="margin-right:8px">返回上一步</button>
        <button class="btn btn-main" @click="resetUpload">重新开始</button>
      </div>
    </template>

    <!-- ========= 预览区（两种模式共用） ========= -->
    <div v-if="parsed && !parseError" class="preview-section">
      <!-- 匹配警告 -->
      <div v-if="matchWarnings.length > 0" class="match-warnings">
        <div class="warn-header">
          <span class="warn-icon">⚠</span>
          <span>匹配提醒（{{ matchWarnings.length }} 条）</span>
          <button class="warn-toggle" @click="showWarnings = !showWarnings">
            {{ showWarnings ? '收起' : '展开' }}
          </button>
        </div>
        <ul v-if="showWarnings" class="warn-list">
          <li v-for="(w, wi) in matchWarnings" :key="wi">{{ w }}</li>
        </ul>
      </div>

      <!-- 题库信息 -->
      <div class="bank-info-bar">
        <div class="bank-name-input">
          <label>题库名称</label>
          <input v-model="bankName" type="text" placeholder="输入题库名称" class="name-input" />
        </div>
        <div class="bank-stats">
          <span class="stat-badge total">共 {{ stats.total }} 题</span>
          <span v-if="stats.typeCounts.single" class="stat-badge single">单选 {{ stats.typeCounts.single }}</span>
          <span v-if="stats.typeCounts.multi" class="stat-badge multi">多选 {{ stats.typeCounts.multi }}</span>
          <span v-if="stats.typeCounts.judge" class="stat-badge judge">判断 {{ stats.typeCounts.judge }}</span>
          <span v-if="stats.typeCounts.fill" class="stat-badge fill">填空 {{ stats.typeCounts.fill }}</span>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="question-preview-list">
        <div
          v-for="(q, idx) in questions" :key="idx"
          class="question-preview-item"
          :class="{ editing: editingIdx === idx, 'unmatched': q.answer === '?' }"
        >
          <div class="q-header">
            <span class="q-num">{{ idx + 1 }}</span>
            <span class="q-type-badge" :class="q.type">{{ typeLabel(q.type) }}</span>
            <span class="q-cat">{{ q.category }}</span>
            <span v-if="q.answer === '?'" class="unmatched-badge">未匹配</span>
            <button v-if="editingIdx !== idx" class="btn-edit" @click="startEdit(idx)">编辑</button>
            <button v-if="editingIdx === idx" class="btn-edit done" @click="finishEdit()">完成</button>
            <button class="btn-delete" @click="removeQuestion(idx)">删除</button>
          </div>

          <div v-if="editingIdx !== idx" class="q-body">
            <!-- 双语标识 -->
            <div v-if="q.bilingual" class="bilingual-tag">中英对照</div>
            <!-- 英文题干 -->
            <p v-if="q.bilingual && q.stemEn" class="q-stem-en">{{ q.stemEn }}</p>
            <!-- 英文选项 -->
            <div v-if="q.bilingual && q.optionsEn && q.optionsEn.length" class="q-options">
              <span v-for="(opt, oi) in q.optionsEn" :key="'en'+oi" class="q-opt">{{ opt.label }}. {{ opt.text }}</span>
            </div>
            <!-- 中文题干 -->
            <p class="q-stem">{{ q.q }}</p>
            <div v-if="q.options && q.options.length" class="q-options">
              <span v-for="(opt, oi) in q.options" :key="oi" class="q-opt">
                {{ String.fromCharCode(65 + oi) }}. {{ opt }}
              </span>
            </div>
            <p class="q-answer">答案：{{ q.answer }}</p>
            <p v-if="q.explain" class="q-explain">{{ q.explain }}</p>
          </div>

          <div v-else class="q-body editing">
            <label>题干</label>
            <textarea v-model="editForm.q" rows="2" class="edit-input"></textarea>
            <label>答案</label>
            <input v-model="editForm.answer" type="text" class="edit-input" />
            <label>解析</label>
            <textarea v-model="editForm.explain" rows="2" class="edit-input"></textarea>
            <label>分类</label>
            <input v-model="editForm.category" type="text" class="edit-input" />
          </div>
        </div>
      </div>

      <div class="action-bar">
        <button class="btn btn-secondary" @click="resetUpload">重新上传</button>
        <button class="btn btn-main" :disabled="saving || questions.length === 0" @click="saveBank">
          {{ saving ? '保存中…' : '保存并上线题库' }}
        </button>
      </div>

      <div v-if="saved" class="success-banner">
        <span class="success-icon">S</span>
        <div>
          <strong>题库已上线！</strong>
          <p>返回首页即可看到新题库并开始刷题</p>
        </div>
        <button class="btn btn-main" @click="$emit('go-home')">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { parseDocxFile, parsePdfFile, parseQuestionsFromLines, parseAnswersFromLines, matchAnswersToQuestions, extractTextFromDocx, parseBilingualLines } from '../utils/docParser.js'
import { extractTextFromPdf } from '../utils/pdfParser.js'
import { saveBank as saveToDB, generateBankId } from '../composables/useBankStorage.js'
import { parseQuestionsWithAI, parseQuestionsWithAIBatched } from '../utils/aiParser.js'

const emit = defineEmits(['go-home', 'bank-added'])

// ──── 文档大小限制 ────
const AI_WARN_CHARS = 15000   // 超过此值触发分段警告
const AI_MAX_CHARS = 60000    // AI 模式硬上限，超出拒绝处理
const RULE_WARN_CHARS = 200000 // 规则引擎大文件提醒

// 模式
const uploadMode = ref('single')

// 解析引擎
const parserEngine = ref('rule') // 'rule' | 'ai'
const apiKeyInput = ref('')
const hasApiKey = ref(false)

// 尝试从 localStorage 加载已保存的 API Key
try {
  const saved = localStorage.getItem('quiz_ai_apikey')
  if (saved) {
    apiKeyInput.value = saved
    hasApiKey.value = true
  }
} catch (e) { /* ignore */ }

function saveApiKey() {
  const key = apiKeyInput.value.trim()
  if (!key) return
  try {
    localStorage.setItem('quiz_ai_apikey', key)
    hasApiKey.value = true
    // 动态注入到 aiParser 模块
    window.__QUIZ_AI_API_KEY = key
  } catch (e) {
    alert('保存失败：' + e.message)
  }
}

// 单文档状态
const dragging = ref(false)
const fileInput = ref(null)

// 双文档状态
const dualPhase = ref('questions')
const draggingQ = ref(false)
const draggingA = ref(false)
const qFileInput = ref(null)
const aFileInput = ref(null)
const parsingQ = ref(false)
const parsingA = ref(false)
const questionsDoc = ref(null)

// 共用状态
const parsing = ref(false)
const parsed = ref(false)
const parseError = ref('')
const questions = ref([])
const stats = ref({ total: 0, typeCounts: {}, categories: [] })
const bankName = ref('')
const saving = ref(false)
const saved = ref(false)
const matchWarnings = ref([])
const showWarnings = ref(false)
const bilingual = ref(false)

// 文档大小警告
const sizeWarning = ref('')

// 编辑
const editingIdx = ref(-1)
const editForm = ref({})

// ──── 文件类型检测 ────
function isDocx(file) { return file.name.toLowerCase().endsWith('.docx') }
function isPdf(file)  { return file.name.toLowerCase().endsWith('.pdf') }
function isSupported(file) { return isDocx(file) || isPdf(file) }

// ──── 辅助函数 ────
function formatCharCount(chars) {
  if (chars >= 1000) return `${(chars / 1000).toFixed(1)}K 字符`
  return `${chars} 字符`
}

function clearSizeWarning() {
  sizeWarning.value = ''
}

// ──── 单文档模式 ────
function triggerFileInput() { fileInput.value?.click() }
function handleFileSelect(e) { const file = e.target.files[0]; if (file) processFileSingle(file) }
function handleDrop(e) { dragging.value = false; const file = e.dataTransfer.files[0]; if (file) processFileSingle(file) }

async function processFileSingle(file) {
  if (!isSupported(file)) { parseError.value = '仅支持 .docx 和 .pdf 格式'; return }

  // AI 模式需检查 Key
  if (parserEngine.value === 'ai' && !hasApiKey.value) {
    parseError.value = '请先配置智谱 API Key（免费注册即可获取）'
    return
  }

  parsing.value = true; parseError.value = ''
  try {
    const name = file.name.replace(/\.\w+$/, '')

    if (parserEngine.value === 'ai') {
      // AI 识别流程
      const lines = isPdf(file) ? await extractTextFromPdf(file) : await extractTextFromDocx(file)
      const text = lines.join('\n')

      // 大小检查：超出硬上限直接拒绝
      if (text.length > AI_MAX_CHARS) {
        throw new Error(
          `文档过大，超出 AI 处理上限。\n` +
          `当前文档：${formatCharCount(text.length)}，上限：${formatCharCount(AI_MAX_CHARS)}。\n` +
          `请将文档拆分为多个小文件后分别上传，或切换到「规则引擎」模式。`
        )
      }

      // 大文本警告 + 自动分批处理
      if (text.length > AI_WARN_CHARS) {
        sizeWarning.value = `文档较大（${formatCharCount(text.length)}），超出 AI 单次处理上限，将自动切换为分段解析。`
      }

      const isLarge = text.length > AI_WARN_CHARS
      const aiResult = isLarge ? await parseQuestionsWithAIBatched(text) : await parseQuestionsWithAI(text)
      if (aiResult.length === 0) {
        throw new Error('AI 未检测到题目，请确认文档包含题目内容')
      }
      questions.value = aiResult.map(q => ({
        q: q.q || '',
        type: q.type || 'single',
        answer: q.answer || '?',
        options: (q.options || []).map(o => typeof o === 'string' ? o : o.text || ''),
        category: q.category || '综合',
        explain: q.explain || '',
        bilingual: false
      }))
      bankName.value = name
      bilingual.value = false
      matchWarnings.value = []
    } else {
      // 规则引擎（原有逻辑）
      const result = isPdf(file) ? await parsePdfFile(file, name) : await parseDocxFile(file, name)

      // 大文件提醒
      if (result.questions.length > 500) {
        sizeWarning.value = `题库较大（${result.questions.length} 题），本地解析虽无上限，但刷题时加载可能较慢。`
      }
      questions.value = result.questions
      stats.value = result.stats
      bankName.value = result.meta.name
      bilingual.value = result.meta.bilingual || false
      matchWarnings.value = []
    }

    buildStats()
    parsed.value = true
  } catch (e) {
    parseError.value = e.message || '解析失败'
    parsed.value = false
  } finally { parsing.value = false }
}

// ──── 双文档模式 ────
function triggerQFileInput() { qFileInput.value?.click() }
function triggerAFileInput() { aFileInput.value?.click() }

function handleQuestionsFileSelect(e) {
  const file = e.target.files[0]
  if (file) processQuestionsFile(file)
}

function handleQuestionsDrop(e) {
  draggingQ.value = false
  const file = e.dataTransfer.files[0]
  if (file) processQuestionsFile(file)
}

async function processQuestionsFile(file) {
  if (!isSupported(file)) { parseError.value = '仅支持 .docx 和 .pdf 格式'; return }

  if (parserEngine.value === 'ai' && !hasApiKey.value) {
    parseError.value = '请先配置智谱 API Key（免费注册即可获取）'
    return
  }

  parsingQ.value = true; parseError.value = ''
  try {
    const lines = isPdf(file) ? await extractTextFromPdf(file) : await extractTextFromDocx(file)

    if (parserEngine.value === 'ai') {
      // AI 识别流程
      const text = lines.join('\n')

      // 大小检查：超出硬上限直接拒绝
      if (text.length > AI_MAX_CHARS) {
        throw new Error(
          `文档过大，超出 AI 处理上限。\n` +
          `当前文档：${formatCharCount(text.length)}，上限：${formatCharCount(AI_MAX_CHARS)}。\n` +
          `请将文档拆分为多个小文件后分别上传，或切换到「规则引擎」模式。`
        )
      }

      // 大文本警告 + 自动分批处理
      if (text.length > AI_WARN_CHARS) {
        sizeWarning.value = `文档较大（${formatCharCount(text.length)}），超出 AI 单次处理上限，将自动切换为分段解析。`
      }

      const isLarge = text.length > AI_WARN_CHARS
      const aiResult = isLarge ? await parseQuestionsWithAIBatched(text) : await parseQuestionsWithAI(text)
      if (aiResult.length === 0) {
        throw new Error('AI 未检测到题目，请确认文档包含题目内容')
      }
      questionsDoc.value = aiResult.map(q => ({
        q: q.q || '',
        type: q.type || 'single',
        answer: q.answer || '?',
        options: (q.options || []).map(o => typeof o === 'string' ? o : o.text || ''),
        category: q.category || '综合',
        explain: q.explain || '',
        bilingual: false
      }))
      bilingual.value = false
    } else {
      // 规则引擎（原有逻辑）
      const bilingualResult = parseBilingualLines(lines)
      if (bilingualResult.bilingual && bilingualResult.questions.length > 0) {
        questionsDoc.value = bilingualResult.questions
        bilingual.value = true
      } else {
        const result = parseQuestionsFromLines(lines, { requireAnswers: false })
        if (result.questions.length === 0) {
          throw new Error('未检测到题目格式。\n请确保文档中每题以数字编号（如 "1."）开头。')
        }
        questionsDoc.value = result.questions
        bilingual.value = false
      }
    }

    bankName.value = file.name.replace(/\.\w+$/, '')
    dualPhase.value = 'answers'
  } catch (e) {
    parseError.value = e.message || '解析失败'
  } finally { parsingQ.value = false }
}

function handleAnswersFileSelect(e) {
  const file = e.target.files[0]
  if (file) processAnswersFile(file)
}

function handleAnswersDrop(e) {
  draggingA.value = false
  const file = e.dataTransfer.files[0]
  if (file) processAnswersFile(file)
}

async function processAnswersFile(file) {
  if (!isSupported(file)) { parseError.value = '仅支持 .docx 和 .pdf 格式'; return }
  parsingA.value = true; parseError.value = ''
  try {
    const lines = isPdf(file) ? await extractTextFromPdf(file) : await extractTextFromDocx(file)
    const { answers, warnings: parseWarnings } = parseAnswersFromLines(lines)

    if (answers.length === 0) {
      throw new Error('答案文档中未检测到答案格式。\n支持：1.B / 1、B / 第1题 B / 1-5 BAC')
    }

    const result = matchAnswersToQuestions(questionsDoc.value, answers)
    questions.value = result.questions
    matchWarnings.value = [...parseWarnings, ...result.warnings]
    showWarnings.value = matchWarnings.value.length > 0
    buildStats()
    parsed.value = true
    dualPhase.value = 'merged'
  } catch (e) {
    parseError.value = e.message || '解析失败'
  } finally { parsingA.value = false }
}

function skipAnswers() {
  questions.value = questionsDoc.value.map(q => ({ ...q, answer: q.answer || '?' }))
  matchWarnings.value = ['已跳过答案匹配，所有题目答案标记为 "?"，请手动编辑。']
  showWarnings.value = true
  buildStats()
  parsed.value = true
  dualPhase.value = 'merged'
}

function resetPhase() {
  if (dualPhase.value === 'answers') {
    parseError.value = ''
    dualPhase.value = 'questions'
    questionsDoc.value = null
  }
}

// ──── 共用 ────
function typeLabel(type) {
  const map = { single: '单选', multi: '多选', judge: '判断', fill: '填空' }
  return map[type] || type
}

function buildStats() {
  const typeCounts = {}
  const categories = new Set()
  for (const q of questions.value) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1
    if (q.category) categories.add(q.category)
  }
  stats.value = { total: questions.value.length, typeCounts, categories: [...categories] }
}

function startEdit(idx) {
  editingIdx.value = idx
  editForm.value = { ...questions.value[idx] }
}

function finishEdit() {
  if (editingIdx.value >= 0) {
    questions.value[editingIdx.value] = { ...editForm.value }
    buildStats()
  }
  editingIdx.value = -1
  editForm.value = {}
}

function removeQuestion(idx) {
  questions.value.splice(idx, 1)
  buildStats()
}

function resetUpload() {
  uploadMode.value = 'single'
  dualPhase.value = 'questions'
  questionsDoc.value = null
  parsed.value = false
  parseError.value = ''
  parsing.value = false
  parsingQ.value = false
  parsingA.value = false
  questions.value = []
  stats.value = { total: 0, typeCounts: {}, categories: [] }
  bankName.value = ''
  saved.value = false
  matchWarnings.value = []
  showWarnings.value = false
  bilingual.value = false
  sizeWarning.value = ''
  if (fileInput.value) fileInput.value.value = ''
  if (qFileInput.value) qFileInput.value.value = ''
  if (aFileInput.value) aFileInput.value.value = ''
}

async function saveBank() {
  if (saving.value || questions.value.length === 0) return
  saving.value = true
  try {
    const id = generateBankId()
    const meta = {
      name: bankName.value || '未命名题库',
      version: '1.0.0',
      total: questions.value.length,
      categories: stats.value.categories,
      typeCounts: stats.value.typeCounts,
    }
    await saveToDB({ id, name: bankName.value, meta, questions: questions.value, createdAt: new Date().toISOString() })
    saved.value = true
    emit('bank-added', { id, name: bankName.value, total: questions.value.length })
  } catch (e) {
    alert('保存失败：' + (e.message || '未知错误'))
  } finally { saving.value = false }
}
</script>

<style scoped>
.upload-page { max-width: 800px; margin: 0 auto; padding: 20px 16px; }
.upload-header { text-align: center; margin-bottom: 24px; }
.upload-header h2 { font-size: 22px; font-weight: 600; color: #1a1a2e; margin: 0 0 6px; }
.upload-header p { font-size: 13px; color: #888; margin: 0; }

/* 模式选择 */
.mode-selector { display: flex; gap: 12px; margin-bottom: 20px; justify-content: center; }
.mode-btn {
  flex: 0 0 200px; padding: 16px;
  border: 2px solid #e0e0e0; border-radius: 12px;
  background: #fff; cursor: pointer; text-align: center;
  transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.mode-btn:hover { border-color: #1a6b5a; }
.mode-btn.active { border-color: #1a6b5a; background: #e6f2ef; }
.mode-icon {
  width: 36px; height: 36px; border-radius: 50%;
  background: #1a6b5a; color: #fff; font-size: 16px; font-weight: 700;
  line-height: 36px; font-family: Georgia, serif;
}
.mode-btn.active .mode-icon { background: #0d5a4a; }
.mode-label { font-size: 15px; font-weight: 600; color: #333; }
.mode-desc { font-size: 11px; color: #999; }

/* 解析引擎选择 */
.engine-selector {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-bottom: 20px;
}
.engine-label { font-size: 12px; color: #888; font-weight: 500; }
.engine-btn {
  padding: 6px 16px; border: 2px solid #e0e0e0; border-radius: 20px;
  background: #fff; font-size: 12px; font-weight: 600; color: #666;
  cursor: pointer; transition: all 0.2s;
}
.engine-btn:hover { border-color: #1a6b5a; color: #1a6b5a; }
.engine-btn.active { border-color: #1a6b5a; background: #1a6b5a; color: #fff; }
.engine-hint { font-size: 11px; color: #c53030; margin-left: 4px; }
.engine-hint.ok { color: #0d7c51; }

/* API Key 提示 */
.apikey-notice {
  display: flex; align-items: flex-start; gap: 12px;
  margin-bottom: 20px; padding: 14px 16px;
  background: #fef9e7; border: 1px solid #f0c859; border-radius: 10px;
}
.apikey-icon { font-size: 20px; flex-shrink: 0; }
.apikey-notice strong { display: block; font-size: 13px; color: #854f0b; margin-bottom: 4px; }
.apikey-notice p { font-size: 11px; color: #666; margin: 0; line-height: 1.6; }
.apikey-notice a { color: #1a6b5a; }
.apikey-input-row { display: flex; gap: 6px; margin-top: 8px; flex-shrink: 0; }
.apikey-input {
  padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px;
  font-size: 12px; width: 200px; outline: none;
}
.apikey-input:focus { border-color: #1a6b5a; }
.btn-small {
  padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600;
  cursor: pointer; border: none; background: #1a6b5a; color: #fff;
}
.btn-small:hover { background: #155a4a; }
.btn-small:disabled { background: #ccc; cursor: not-allowed; }

/* 步骤指示器 */
.phase-steps { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 16px; }
.step { font-size: 13px; color: #bbb; font-weight: 500; }
.step.active { color: #1a6b5a; font-weight: 600; }
.step.done { color: #0d7c51; }
.step-arrow { color: #ccc; font-size: 16px; }

/* 题目摘要 */
.q-summary {
  text-align: center; padding: 12px; margin-bottom: 16px;
  background: #e6f2ef; border-radius: 8px; font-size: 14px; color: #1a6b5a;
}
.q-summary strong { font-weight: 700; }

/* 拖拽区 */
.drop-zone {
  border: 2px dashed #ccc; border-radius: 16px; padding: 48px 24px;
  text-align: center; cursor: pointer; transition: all 0.2s; background: #fafafa;
}
.drop-zone:hover, .drop-zone.drag-over { border-color: #1a6b5a; background: #e6f2ef; }
.answers-zone { border-color: #f0c859; }
.answers-zone:hover, .answers-zone.drag-over { border-color: #d4a017; background: #fdf6e3; }
.drop-icon {
  width: 56px; height: 56px; border-radius: 50%; font-size: 20px; font-weight: 700;
  line-height: 56px; margin: 0 auto 12px; font-family: Georgia, serif;
}
.drop-zone:not(.answers-zone) .drop-icon { background: #1a6b5a; color: #fff; }
.answers-zone .drop-icon { background: #d4a017; color: #fff; }
.drop-title { font-size: 16px; font-weight: 600; color: #333; margin: 0 0 4px; }
.drop-sub { font-size: 13px; color: #1a6b5a; margin: 0; text-decoration: underline; }
.answers-zone .drop-sub { color: #b8860b; }
.drop-hint { font-size: 11px; color: #aaa; margin: 12px 0 0; }
.skip-btn { margin-top: 12px; width: 100%; text-align: center; font-size: 12px; }

/* 格式说明 */
.format-guide { margin-top: 20px; background: #f7f4ef; border-radius: 12px; padding: 16px; }
.format-guide h4 { font-size: 13px; font-weight: 600; color: #666; margin: 0 0 10px; }
.format-examples { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.format-item { background: #fff; border-radius: 8px; padding: 10px; }
.format-item code { display: block; font-size: 11px; color: #555; margin-top: 6px; line-height: 1.6; white-space: pre-line; }
.format-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
.format-badge.single { background: #e6f1fb; color: #185fa5; }
.format-badge.multi { background: #fbeaf0; color: #993556; }
.format-badge.judge { background: #faeeda; color: #854f0b; }
.format-badge.fill { background: #e1f5ee; color: #0f6e56; }

/* 解析中 */
.parsing-section { text-align: center; padding: 60px 20px; }
.parsing-section p { font-size: 15px; color: #666; margin: 16px 0 0; }
.parsing-sub { font-size: 12px !important; color: #999 !important; }
.loading-spinner {
  width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #1976d2;
  border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 错误 */
.error-section { text-align: center; padding: 40px 20px; }
.error-icon {
  width: 48px; height: 48px; border-radius: 50%; background: #c53030; color: #fff;
  font-size: 24px; font-weight: 700; line-height: 48px; margin: 0 auto 12px; font-family: Georgia, serif;
}
.error-section h3 { font-size: 18px; color: #333; margin: 0 0 8px; }
.error-msg { font-size: 13px; color: #888; margin: 0 0 16px; white-space: pre-line; }

/* 匹配警告 */
.match-warnings { margin-bottom: 14px; border: 1px solid #f0c859; border-radius: 10px; overflow: hidden; }

/* 文档大小警告 */
.size-warning {
  display: flex; align-items: flex-start; gap: 12px;
  margin-top: 16px; padding: 14px 16px;
  background: #fef9e7; border: 1px solid #f0c859; border-radius: 10px;
}
.size-warn-icon { font-size: 20px; flex-shrink: 0; line-height: 1.4; }
.size-warn-body { flex: 1; }
.size-warn-body strong { display: block; font-size: 13px; color: #854f0b; margin-bottom: 4px; }
.size-warn-body p { font-size: 11px; color: #888; margin: 0; line-height: 1.5; }
.size-warning .btn-small { flex-shrink: 0; align-self: center; }
.warn-header {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  background: #fef9e7; font-size: 13px; color: #854f0b; font-weight: 600;
}
.warn-icon { font-size: 16px; }
.warn-toggle { margin-left: auto; font-size: 11px; color: #b8860b; background: none; border: none; cursor: pointer; }
.warn-list { margin: 0; padding: 10px 14px 10px 32px; background: #fffdf5; font-size: 12px; color: #666; line-height: 1.8; }

/* 预览区 */
.bank-info-bar {
  display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
  gap: 12px; margin-bottom: 16px; padding: 16px; background: #f7f4ef; border-radius: 12px;
}
.bank-name-input label { display: block; font-size: 11px; color: #888; margin-bottom: 4px; }
.name-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; width: 240px; outline: none; }
.name-input:focus { border-color: #1a6b5a; }
.bank-stats { display: flex; gap: 6px; flex-wrap: wrap; }
.stat-badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.stat-badge.total { background: #1a1a2e; color: #fff; }
.stat-badge.single { background: #e6f1fb; color: #185fa5; }
.stat-badge.multi { background: #fbeaf0; color: #993556; }
.stat-badge.judge { background: #faeeda; color: #854f0b; }
.stat-badge.fill { background: #e1f5ee; color: #0f6e56; }

/* 题目列表 */
.question-preview-list { max-height: 500px; overflow-y: auto; border: 1px solid #eee; border-radius: 12px; }
.question-preview-item { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; transition: background 0.15s; }
.question-preview-item:last-child { border-bottom: none; }
.question-preview-item.editing { background: #fefdf8; }
.question-preview-item.unmatched { border-left: 3px solid #f0c859; }
.q-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.q-num {
  width: 26px; height: 26px; border-radius: 50%; background: #1a1a2e; color: #fff;
  font-size: 12px; font-weight: 600; line-height: 26px; text-align: center; flex-shrink: 0;
}
.q-type-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
.q-type-badge.single { background: #e6f1fb; color: #185fa5; }
.q-type-badge.multi { background: #fbeaf0; color: #993556; }
.q-type-badge.judge { background: #faeeda; color: #854f0b; }
.q-type-badge.fill { background: #e1f5ee; color: #0f6e56; }
.q-cat { font-size: 11px; color: #999; flex: 1; }
.unmatched-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #fef9e7; color: #b8860b; }
.btn-edit, .btn-delete {
  font-size: 11px; padding: 3px 10px; border: 1px solid #ddd; border-radius: 5px; background: #fff; cursor: pointer; color: #666;
}
.btn-edit:hover { border-color: #1a6b5a; color: #1a6b5a; }
.btn-edit.done { background: #1a6b5a; color: #fff; border-color: #1a6b5a; }
.btn-delete:hover { border-color: #c53030; color: #c53030; }
.q-stem { font-size: 14px; color: #333; margin: 0 0 6px; line-height: 1.6; }
.bilingual-tag {
  display: inline-block; padding: 1px 8px; border-radius: 3px;
  font-size: 10px; font-weight: 600; background: #e6f2ef; color: #1a6b5a; margin-bottom: 6px;
}
.q-stem-en {
  font-size: 13px; color: #555; margin: 0 0 8px; line-height: 1.5;
  padding: 8px 10px; background: #f7f9fb; border-radius: 6px; border-left: 3px solid #1a6b5a;
}
.q-options { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-bottom: 4px; }
.q-opt { font-size: 12px; color: #666; }
.q-answer { font-size: 12px; color: #0d7c51; font-weight: 600; margin: 4px 0; }
.q-explain { font-size: 11px; color: #999; margin: 2px 0 0; }
.q-body.editing label { display: block; font-size: 11px; color: #888; margin: 8px 0 3px; }
.edit-input {
  width: 100%; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px;
  font-size: 13px; outline: none; font-family: inherit; box-sizing: border-box;
}
.edit-input:focus { border-color: #1a6b5a; }
.action-bar { display: flex; justify-content: center; gap: 12px; margin-top: 20px; }

.btn {
  padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
}
.btn-main { background: #1a6b5a; color: #fff; }
.btn-main:hover { background: #155a4b; }
.btn-main:disabled { background: #ccc; cursor: not-allowed; }
.btn-secondary { background: #fff; color: #666; border: 1px solid #ddd; }
.btn-secondary:hover { border-color: #999; }

.success-banner {
  display: flex; align-items: center; gap: 12px; margin-top: 20px;
  padding: 16px 20px; background: #e6f4ec; border-radius: 12px; border: 1px solid #c0dd97;
}
.success-icon {
  width: 40px; height: 40px; border-radius: 50%; background: #0d7c51; color: #fff;
  font-size: 16px; font-weight: 700; line-height: 40px; text-align: center; flex-shrink: 0; font-family: Georgia, serif;
}
.success-banner strong { display: block; font-size: 14px; color: #0d7c51; }
.success-banner p { font-size: 12px; color: #666; margin: 2px 0 0; }
.success-banner .btn-main { margin-left: auto; flex-shrink: 0; }
</style>
