<template>
  <div class="upload-page">
    <!-- 标题区 -->
    <div class="upload-header">
      <h2>创建新题库</h2>
      <p>上传 Word 文档（.docx），自动解析为在线题库</p>
    </div>

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
        <input
          ref="fileInput"
          type="file"
          accept=".docx"
          style="display: none"
          @change="handleFileSelect"
        />
        <div class="drop-icon">D</div>
        <p class="drop-title">拖拽 .docx 文件到这里</p>
        <p class="drop-sub">或点击选择文件</p>
        <p class="drop-hint">支持 .docx 格式的 Word 文档</p>
      </div>

      <!-- 格式说明 -->
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

    <!-- 解析中 -->
    <div v-if="parsing" class="parsing-section">
      <div class="loading-spinner"></div>
      <p>正在解析文档…</p>
      <p class="parsing-sub">正在提取文本并识别题目格式</p>
    </div>

    <!-- 解析错误 -->
    <div v-if="parseError" class="error-section">
      <div class="error-icon">!</div>
      <h3>解析失败</h3>
      <p class="error-msg">{{ parseError }}</p>
      <button class="btn btn-main" @click="resetUpload">重新上传</button>
    </div>

    <!-- Step 2: 预览区 -->
    <div v-if="parsed && !parseError" class="preview-section">
      <!-- 题库信息 -->
      <div class="bank-info-bar">
        <div class="bank-name-input">
          <label>题库名称</label>
          <input
            v-model="bankName"
            type="text"
            placeholder="输入题库名称"
            class="name-input"
          />
        </div>
        <div class="bank-stats">
          <span class="stat-badge total">共 {{ stats.total }} 题</span>
          <span v-if="stats.typeCounts.single" class="stat-badge single">单选 {{ stats.typeCounts.single }}</span>
          <span v-if="stats.typeCounts.multi" class="stat-badge multi">多选 {{ stats.typeCounts.multi }}</span>
          <span v-if="stats.typeCounts.judge" class="stat-badge judge">判断 {{ stats.typeCounts.judge }}</span>
          <span v-if="stats.typeCounts.fill" class="stat-badge fill">填空 {{ stats.typeCounts.fill }}</span>
        </div>
      </div>

      <!-- 题目列表预览 -->
      <div class="question-preview-list">
        <div
          v-for="(q, idx) in questions"
          :key="idx"
          class="question-preview-item"
          :class="{ editing: editingIdx === idx }"
        >
          <div class="q-header">
            <span class="q-num">{{ idx + 1 }}</span>
            <span class="q-type-badge" :class="q.type">{{ typeLabel(q.type) }}</span>
            <span class="q-cat">{{ q.category }}</span>
            <button
              v-if="editingIdx !== idx"
              class="btn-edit"
              @click="startEdit(idx)"
            >编辑</button>
            <button
              v-if="editingIdx === idx"
              class="btn-edit done"
              @click="finishEdit()"
            >完成</button>
            <button
              class="btn-delete"
              @click="removeQuestion(idx)"
            >删除</button>
          </div>

          <!-- 只读预览 -->
          <div v-if="editingIdx !== idx" class="q-body">
            <p class="q-stem">{{ q.q }}</p>
            <div v-if="q.options && q.options.length" class="q-options">
              <span v-for="(opt, oi) in q.options" :key="oi" class="q-opt">
                {{ String.fromCharCode(65 + oi) }}. {{ opt }}
              </span>
            </div>
            <p class="q-answer">答案：{{ q.answer }}</p>
            <p v-if="q.explain" class="q-explain">{{ q.explain }}</p>
          </div>

          <!-- 编辑模式 -->
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

      <!-- 操作按钮 -->
      <div class="action-bar">
        <button class="btn btn-secondary" @click="resetUpload">重新上传</button>
        <button
          class="btn btn-main"
          :disabled="saving || questions.length === 0"
          @click="saveBank"
        >
          {{ saving ? '保存中…' : '保存并上线题库' }}
        </button>
      </div>

      <!-- 保存成功 -->
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
import { parseDocxFile } from '../utils/docParser.js'
import { saveBank as saveToDB, generateBankId } from '../composables/useBankStorage.js'

const emit = defineEmits(['go-home', 'bank-added'])

// 上传状态
const dragging = ref(false)
const parsing = ref(false)
const parsed = ref(false)
const parseError = ref('')
const fileInput = ref(null)

// 解析结果
const bankName = ref('')
const questions = ref([])
const stats = ref({ total: 0, typeCounts: {}, categories: [] })
const saving = ref(false)
const saved = ref(false)

// 编辑状态
const editingIdx = ref(-1)
const editForm = ref({})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

async function processFile(file) {
  if (!file.name.endsWith('.docx')) {
    parseError.value = '仅支持 .docx 格式的 Word 文档'
    return
  }

  parsing.value = true
  parseError.value = ''

  try {
    const result = await parseDocxFile(file, file.name.replace('.docx', ''))
    questions.value = result.questions
    stats.value = result.stats
    bankName.value = result.meta.name
    parsed.value = true
  } catch (e) {
    parseError.value = e.message || '解析失败，请检查文件格式'
    parsed.value = false
  } finally {
    parsing.value = false
  }
}

function typeLabel(type) {
  const map = { single: '单选', multi: '多选', judge: '判断', fill: '填空' }
  return map[type] || type
}

function startEdit(idx) {
  editingIdx.value = idx
  const q = questions.value[idx]
  editForm.value = { ...q }
}

function finishEdit() {
  if (editingIdx.value >= 0) {
    questions.value[editingIdx.value] = { ...editForm.value }
    // 重新统计
    const typeCounts = {}
    const categories = new Set()
    for (const q of questions.value) {
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1
      categories.add(q.category)
    }
    stats.value = { total: questions.value.length, typeCounts, categories: [...categories] }
  }
  editingIdx.value = -1
  editForm.value = {}
}

function removeQuestion(idx) {
  questions.value.splice(idx, 1)
  const typeCounts = {}
  const categories = new Set()
  for (const q of questions.value) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1
    categories.add(q.category)
  }
  stats.value = { total: questions.value.length, typeCounts, categories: [...categories] }
}

function resetUpload() {
  parsed.value = false
  parseError.value = ''
  parsing.value = false
  questions.value = []
  stats.value = { total: 0, typeCounts: {}, categories: [] }
  bankName.value = ''
  saved.value = false
  if (fileInput.value) fileInput.value.value = ''
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

    await saveToDB({
      id,
      name: bankName.value,
      meta,
      questions: questions.value,
      createdAt: new Date().toISOString(),
    })

    saved.value = true
    emit('bank-added', { id, name: bankName.value, total: questions.value.length })
  } catch (e) {
    alert('保存失败：' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.upload-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 16px;
}

.upload-header {
  text-align: center;
  margin-bottom: 24px;
}
.upload-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 6px;
}
.upload-header p {
  font-size: 13px;
  color: #888;
  margin: 0;
}

/* 拖拽区 */
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}
.drop-zone:hover,
.drop-zone.drag-over {
  border-color: #1a6b5a;
  background: #e6f2ef;
}
.drop-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #1a6b5a;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  line-height: 56px;
  margin: 0 auto 12px;
  font-family: Georgia, serif;
}
.drop-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}
.drop-sub {
  font-size: 13px;
  color: #1a6b5a;
  margin: 0;
  text-decoration: underline;
}
.drop-hint {
  font-size: 11px;
  color: #aaa;
  margin: 12px 0 0;
}

/* 格式说明 */
.format-guide {
  margin-top: 20px;
  background: #f7f4ef;
  border-radius: 12px;
  padding: 16px;
}
.format-guide h4 {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin: 0 0 10px;
}
.format-examples {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.format-item {
  background: #fff;
  border-radius: 8px;
  padding: 10px;
}
.format-item code {
  display: block;
  font-size: 11px;
  color: #555;
  margin-top: 6px;
  line-height: 1.6;
  white-space: pre-line;
}
.format-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}
.format-badge.single { background: #e6f1fb; color: #185fa5; }
.format-badge.multi { background: #fbeaf0; color: #993556; }
.format-badge.judge { background: #faeeda; color: #854f0b; }
.format-badge.fill { background: #e1f5ee; color: #0f6e56; }

/* 解析中 */
.parsing-section {
  text-align: center;
  padding: 60px 20px;
}
.parsing-section p {
  font-size: 15px;
  color: #666;
  margin: 16px 0 0;
}
.parsing-sub {
  font-size: 12px !important;
  color: #999 !important;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 错误 */
.error-section {
  text-align: center;
  padding: 40px 20px;
}
.error-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #c53030;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  line-height: 48px;
  margin: 0 auto 12px;
  font-family: Georgia, serif;
}
.error-section h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px;
}
.error-msg {
  font-size: 13px;
  color: #888;
  margin: 0 0 16px;
  white-space: pre-line;
}

/* 预览区 */
.bank-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #f7f4ef;
  border-radius: 12px;
}
.bank-name-input label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
}
.name-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  width: 240px;
  outline: none;
}
.name-input:focus {
  border-color: #1a6b5a;
}
.bank-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.stat-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.stat-badge.total { background: #1a1a2e; color: #fff; }
.stat-badge.single { background: #e6f1fb; color: #185fa5; }
.stat-badge.multi { background: #fbeaf0; color: #993556; }
.stat-badge.judge { background: #faeeda; color: #854f0b; }
.stat-badge.fill { background: #e1f5ee; color: #0f6e56; }

/* 题目列表 */
.question-preview-list {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 12px;
}
.question-preview-item {
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}
.question-preview-item:last-child { border-bottom: none; }
.question-preview-item.editing { background: #fefdf8; }

.q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.q-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #1a1a2e;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 26px;
  text-align: center;
  flex-shrink: 0;
}
.q-type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}
.q-type-badge.single { background: #e6f1fb; color: #185fa5; }
.q-type-badge.multi { background: #fbeaf0; color: #993556; }
.q-type-badge.judge { background: #faeeda; color: #854f0b; }
.q-type-badge.fill { background: #e1f5ee; color: #0f6e56; }
.q-cat {
  font-size: 11px;
  color: #999;
  flex: 1;
}
.btn-edit, .btn-delete {
  font-size: 11px;
  padding: 3px 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  color: #666;
}
.btn-edit:hover { border-color: #1a6b5a; color: #1a6b5a; }
.btn-edit.done { background: #1a6b5a; color: #fff; border-color: #1a6b5a; }
.btn-delete:hover { border-color: #c53030; color: #c53030; }

.q-body { }
.q-stem { font-size: 14px; color: #333; margin: 0 0 6px; line-height: 1.6; }
.q-options { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-bottom: 4px; }
.q-opt { font-size: 12px; color: #666; }
.q-answer { font-size: 12px; color: #0d7c51; font-weight: 600; margin: 4px 0; }
.q-explain { font-size: 11px; color: #999; margin: 2px 0 0; }

/* 编辑模式 */
.q-body.editing label {
  display: block;
  font-size: 11px;
  color: #888;
  margin: 8px 0 3px;
}
.edit-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.edit-input:focus { border-color: #1a6b5a; }

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

/* 按钮 */
.btn {
  padding: 10px 28px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}
.btn-main {
  background: #1a6b5a;
  color: #fff;
}
.btn-main:hover { background: #155a4b; }
.btn-main:disabled { background: #ccc; cursor: not-allowed; }
.btn-secondary {
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
}
.btn-secondary:hover { border-color: #999; }

/* 成功横幅 */
.success-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 16px 20px;
  background: #e6f4ec;
  border-radius: 12px;
  border: 1px solid #c0dd97;
}
.success-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #0d7c51;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  line-height: 40px;
  text-align: center;
  flex-shrink: 0;
  font-family: Georgia, serif;
}
.success-banner strong {
  display: block;
  font-size: 14px;
  color: #0d7c51;
}
.success-banner p {
  font-size: 12px;
  color: #666;
  margin: 2px 0 0;
}
.success-banner .btn-main {
  margin-left: auto;
  flex-shrink: 0;
}
</style>
