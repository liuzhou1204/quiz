/**
 * aiParser.js - 基于智谱 GLM-4-Flash 大模型的题目智能解析
 *
 * 调用智谱 AI API，从文档文本中提取结构化题目。
 * 相比规则引擎，AI 能更好地处理格式不规范、排版混乱的文档。
 *
 * 使用方式：
 *   1. 前往 https://open.bigmodel.cn/ 注册并获取免费 API Key
 *   2. 将 Key 填入下方 API_KEY 常量
 *   3. 在 UploadPage 中选择 "AI 识别" 模式
 */

const API_KEY = '386bde222b534cadb234f90f609dc488.Mz69dSXGhIOkAVxC'
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const MODEL = 'glm-4-flash'

const SYSTEM_PROMPT = `你是一个专业的题库解析专家。你的任务是从给定的文档文本中，准确提取所有题目，并输出结构化 JSON。

## 输出格式要求
必须是严格的 JSON 数组，每个题目对象包含以下字段：

{
  "q": "题干的纯文本内容（不含题号和选项）",
  "type": "single|multi|judge|fill",
  "answer": "正确答案",
  "options": [{"label": "A", "text": "选项内容"}, ...],
  "category": "分类",
  "explain": "解析说明（如果有的话，没有则为空字符串）"
}

## 题型判断规则
- single（单选）：只有一个正确选项，选项通常为 A-D
- multi（多选）：有多个正确选项，答案以逗号分隔如 "A,B,C"，或题干含"哪些/多项/以下正确的"
- judge（判断）：答案为"正确"或"错误"，或"对/错"、"√/×"
- fill（填空）：题干含 ____ 或 （ ），答案为填空关键词

## 分类规则
根据题干内容推断分类，常见分类：进度管理、成本管理、质量管理、范围管理、整合管理、资源管理、沟通管理、风险管理、采购管理、相关方管理、冲突管理、领导力。无法判断时填"综合"。

## 答案格式
- 单选："A"（只返回字母）
- 多选："A,B,C"（字母逗号分隔）
- 判断："正确"或"错误"
- 填空：填空关键词字符串

## 选项格式
- 选择类题目必须提供 options 数组
- 判断和填空类题目 options 为空数组 []

## 注意事项
1. 严格输出 JSON，不要包含 markdown 代码块标记
2. 不要输出任何解释性文字，只输出 JSON 数组
3. 保持题目原始顺序
4. 如果文档中没有题目，返回空数组 []
5. 题干中不要包含题号（如 "1."）`

/**
 * 调用智谱 AI 解析题目
 * @param {string} text - 文档全文（任意大小，调用方负责分批）
 * @param {Object} [opts] - 可选参数
 * @param {number} [opts.maxTokens=4096] - 最大输出 token 数
 * @returns {Promise<Array>} 结构化题目数组
 */
export async function parseQuestionsWithAI(text, { maxTokens = 4096 } = {}) {
  const key = API_KEY || (typeof window !== 'undefined' && window.__QUIZ_AI_API_KEY) || ''
  if (!key) {
    throw new Error('未配置 AI API Key。请先在页面中输入智谱 API Key')
  }

  // 不再截断文本 —— 超出上下文窗口的请求由 API 返回错误，
  // 调用方应使用 parseQuestionsWithAIBatched 分批处理大文档。
  const truncated = text

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `请从以下文档中提取所有题目：\n\n${truncated}` }
      ],
      temperature: 0.1,
      max_tokens: maxTokens
    })
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`AI API 请求失败 (${response.status}): ${errBody.slice(0, 200)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('AI 返回内容为空')
  }

  // 尝试解析 JSON（兼容 markdown 代码块包裹的情况）
  let jsonStr = content.trim()

  // 移除可能的 markdown 代码块标记
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  }

  let questions
  try {
    questions = JSON.parse(jsonStr)
  } catch (e) {
    // 尝试修复常见 JSON 问题后重试
    let fixed = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')

    // 如果是被截断的 JSON 数组（以 [ 开头但没有 ] 结尾），尝试补全
    if (fixed.trim().startsWith('[') && !fixed.trim().endsWith(']')) {
      // 找到最后一个完整的对象
      const lastComplete = fixed.lastIndexOf('},')
      if (lastComplete > 0) {
        fixed = fixed.slice(0, lastComplete + 1) + ']'
      }
    }
    // 如果是被截断的对象（以 { 开头但没有 } 结尾），尝试补全
    if (fixed.trim().startsWith('{') && !fixed.trim().endsWith('}')) {
      const lastBrace = fixed.lastIndexOf('}')
      if (lastBrace > 0) {
        fixed = fixed.slice(0, lastBrace + 1)
      }
    }

    try {
      questions = JSON.parse(fixed)
    } catch (e2) {
      // 显示原始错误：是被截断了还是格式错误
      const isTruncated = content.length >= 4095
      const hint = isTruncated
        ? '\n(Hint: AI 返回可能因内容过多被截断，文档太长建议分段处理)'
        : ''
      throw new Error(`AI 返回格式解析失败。${hint}\n原始内容:\n${content.slice(0, 500)}`)
    }
  }

  // 处理 AI 返回单个对象（而非数组）的情况
  if (!Array.isArray(questions)) {
    if (typeof questions === 'object' && questions.q) {
      questions = [questions]
    } else {
      throw new Error(`AI 返回的不是题目数组 (type=${typeof questions})`)
    }
  }

  // 补充缺失字段
  questions.forEach((q, i) => {
    q.type = q.type || 'single'
    q.options = q.options || []
    q.category = q.category || '综合'
    q.explain = q.explain || ''
    if (!q.answer) q.answer = '?'
  })

  return questions
}

/**
 * 批量解析（将大文本分段处理，适合超长文档）
 * 每段独立调用 AI，最后合并结果。
 * @param {string} text - 文档全文
 * @param {number} [chunkSize=40000] - 每段字符数（GLM-4-Flash 支持 128K 上下文）
 * @param {number} [maxTokens=8192] - 每段最大输出 token 数
 * @returns {Promise<Array>} 合并后的题目数组
 */
export async function parseQuestionsWithAIBatched(text, chunkSize = 40000, maxTokens = 8192) {
  if (text.length <= chunkSize) {
    return parseQuestionsWithAI(text, { maxTokens })
  }

  // 按段落分割，尽量在双换行处断开
  const chunks = []
  let start = 0
  while (start < text.length) {
    let end = start + chunkSize
    if (end < text.length) {
      // 向前找最近的双换行（段落边界）
      const searchStart = Math.max(start, end - 2000)
      const lastBreak = text.lastIndexOf('\n\n', end)
      if (lastBreak > searchStart) {
        end = lastBreak
      }
    }
    chunks.push(text.slice(start, end))
    start = end
  }

  const allQuestions = []
  for (let i = 0; i < chunks.length; i++) {
    const chunkQuestions = await parseQuestionsWithAI(chunks[i], { maxTokens })
    allQuestions.push(...chunkQuestions)
  }

  return allQuestions
}

/**
 * 查询智谱账号剩余额度 / 用量（占位口子）
 *
 * 当前直接返回 null（不启用）。
 * 后续接入计费提醒时，取消注释并填入真实 API 调用：
 *   GET https://open.bigmodel.cn/api/paas/v4/billing/subscription
 *   Header: Authorization: Bearer <API_KEY>
 *
 * @returns {Promise<{ total:number, used:number, remain:number }|null>}
 */
export async function fetchAIQuota(apiKey) {
  // TODO: 取消注释以下代码以启用额度查询
  // if (!apiKey) return null
  // try {
  //   const r = await fetch('https://open.bigmodel.cn/api/paas/v4/billing/subscription', {
  //     headers: { 'Authorization': `Bearer ${apiKey}` }
  //   })
  //   if (!r.ok) return null
  //   const d = await r.json()
  //   return { total: d.total, used: d.used, remain: d.total - d.used }
  // } catch { return null }
  return null
}

/**
 * 根据字符数估算 token 消耗（中文约 1.5~2 字符/token，英文约 4 字符/token）
 * 用于上传前给用户一个参考值，不保证精确。
 * @param {string} text
 * @returns {{ chars:number, estimatedTokens:number, chunks:number }}
 */
export function estimateTokenUsage(text, chunkSize = 40000) {
  const chars = text.length
  // 中英混合文档，粗略按 2 字符 ≈ 1 token 估算
  const estimatedTokens = Math.ceil(chars / 2)
  const chunks = Math.ceil(chars / chunkSize)
  return { chars, estimatedTokens, chunks }
}
