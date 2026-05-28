/**
 * docParser.js - 浏览器端文档解析 + 题目提取
 *
 * 用 mammoth.js 提取 .docx 文本，
 * 然后用正则规则解析 Q&A 格式（参考 scripts/docx_to_json.py 逻辑），
 * 返回结构化题目数组。
 *
 * 支持题型：单选(single)、多选(multi)、判断(judge)、填空(fill)
 */

import mammoth from 'mammoth'

/**
 * 从 .docx 文件中提取纯文本行
 * @param {File} file - 用户上传的 .docx 文件
 * @returns {Promise<string[]>} 文本行数组
 */
export async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = result.value || ''

  // 按行分割，去除空行
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (result.messages && result.messages.length > 0) {
    console.warn('Mammoth warnings:', result.messages)
  }

  return lines
}

/**
 * 判断题目类型
 */
function classifyQuestionType(lines, qStart, answerLineIdx) {
  const stem = lines.slice(qStart, answerLineIdx).join(' ')

  // 判断题：答案为正确/错误/对/错
  if (answerLineIdx < lines.length) {
    const answerText = lines[answerLineIdx]
    if (/答案[：:]\s*(正确|错误|对|错)/.test(answerText)) {
      return 'judge'
    }
  }

  // 填空题：含下划线或括号占位
  if (/_{2,}|\(\s*\)|（\s*）/.test(stem)) {
    return 'fill'
  }

  // 多选题：题干含关键词
  const multiKeywords = ['哪些', '以下哪些', '多项', '多项选择', '多选题', '以下正确的']
  if (multiKeywords.some(kw => stem.includes(kw))) {
    return 'multi'
  }

  // 选项数量判断：5+ 选项通常为多选
  let optionCount = 0
  for (let i = qStart; i < answerLineIdx; i++) {
    if (/^[A-F][.、)\s]/.test(lines[i])) {
      optionCount++
    }
  }
  if (optionCount >= 5) return 'multi'

  return 'single'
}

/**
 * 从行中提取选项
 */
function parseOptions(lines, qStart, answerLineIdx) {
  const options = []
  for (let i = qStart; i < answerLineIdx; i++) {
    const match = lines[i].match(/^([A-F])[.、)\s]\s*(.*)/)
    if (match) {
      options.push({ label: match[1], text: match[2].trim() })
    }
  }
  return options
}

/**
 * 提取答案文本
 */
function parseAnswer(answerText) {
  return answerText.replace(/^(正确)?答案\s*[：:]\s*/, '').trim()
}

/**
 * 提取题干
 */
function parseStem(lines, qStart, answerLineIdx) {
  const stemLines = []
  for (let i = qStart; i < answerLineIdx; i++) {
    const stripped = lines[i]
    // 跳过选项行
    if (/^[A-F][.、)\s]/.test(stripped)) continue
    // 移除题号前缀
    let cleaned = stripped.replace(/^\d{1,3}[.、)\s]\s*/, '')
    cleaned = cleaned.replace(/^第?\d{1,3}题[.、:\s]*/, '')
    if (cleaned) stemLines.push(cleaned)
  }
  return stemLines.join('\n')
}

/**
 * 提取解析
 */
function parseExplain(lines, answerLineIdx) {
  const explainLines = []
  for (let i = answerLineIdx + 1; i < Math.min(answerLineIdx + 3, lines.length); i++) {
    const line = lines[i]
    if (!line || /^\d{1,3}[.、)\s]/.test(line) || /^第?\d{1,3}题/.test(line)) break
    if (line.startsWith('答案') || line.startsWith('正确答案')) continue
    explainLines.push(line)
  }
  return explainLines.join('\n')
}

/**
 * 从题干关键词推断分类
 */
function extractCategory(stem) {
  const categoryKeywords = {
    '进度管理': ['进度', '工期', '关键路径', 'CPM', 'PERT', '里程碑', '赶工', '快速跟进', '资源平衡'],
    '成本管理': ['成本', '预算', '估算', '挣值', 'EVM', 'EAC', 'CPI', 'SPI', '储备'],
    '质量管理': ['质量', '缺陷', 'QA', 'QC', 'PDCA', '石川图', '帕累托', '控制图'],
    '范围管理': ['范围', 'WBS', '需求', '可交付成果', '范围蔓延', '工作包'],
    '整合管理': ['整合', '变更', 'CCB', '章程', '收尾', '项目章程'],
    '资源管理': ['资源', '团队', '塔克曼', '冲突', '矩阵', '预分派'],
    '沟通管理': ['沟通', '渠道', '会议', '相关方', '干系人'],
    '风险管理': ['风险', '威胁', '机会', '应急', 'EMV', '规避', '转移'],
    '采购管理': ['采购', '合同', '招标', '投标', 'FFP', 'CPIF'],
    '相关方管理': ['相关方', '权力', '利益', '方格', '参与度'],
    '冲突管理': ['冲突'],
    '领导力': ['领导', '领导力', '情境领导'],
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      if (stem.toLowerCase().includes(kw.toLowerCase())) {
        return category
      }
    }
  }
  return '综合'
}

/**
 * 从文本行数组解析题目
 * @param {string[]} lines - 文本行
 * @returns {{ questions: Array, stats: Object }}
 */
export function parseQuestionsFromLines(lines) {
  const questions = []
  let i = 0
  const n = lines.length

  while (i < n) {
    const line = lines[i]

    // 检测题目开头：数字编号 或 "第X题"
    if (!/^(\d{1,3}[.、)\s]|第?\d{1,3}题)/.test(line)) {
      i++
      continue
    }

    const qStart = i
    i++

    // 找答案行和下一题
    let answerLineIdx = -1
    while (i < n) {
      const curr = lines[i]
      if (/^(正确)?答案\s*[：:]/.test(curr)) {
        answerLineIdx = i
        i++
        break
      }
      if (/^\d{1,3}[.、)\s]/.test(curr) && i > qStart + 1) {
        break
      }
      i++
    }

    if (answerLineIdx === -1) continue

    const qType = classifyQuestionType(lines, qStart, answerLineIdx)
    const stem = parseStem(lines, qStart, answerLineIdx)
    const answerText = parseAnswer(lines[answerLineIdx])
    const explain = parseExplain(lines, answerLineIdx)
    const options = parseOptions(lines, qStart, answerLineIdx)
    const category = extractCategory(stem)

    const question = {
      q: stem,
      answer: answerText,
      explain,
      category,
      type: qType,
    }

    if ((qType === 'single' || qType === 'multi') && options.length > 0) {
      question.options = options.map(o => o.text)
    }

    questions.push(question)
  }

  // 统计
  const typeCounts = {}
  const categories = new Set()
  for (const q of questions) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1
    categories.add(q.category)
  }

  return {
    questions,
    stats: {
      total: questions.length,
      typeCounts,
      categories: [...categories],
    },
  }
}

/**
 * 主函数：解析 .docx 文件，返回完整题库数据
 * @param {File} file
 * @param {string} bankName
 * @returns {Promise<{ meta: Object, questions: Array, stats: Object }>}
 */
export async function parseDocxFile(file, bankName) {
  const lines = await extractTextFromDocx(file)
  const { questions, stats } = parseQuestionsFromLines(lines)

  if (questions.length === 0) {
    throw new Error('未检测到题目格式。\n\n请确保文档中每题以数字编号开头（如 "1."、"1、"），答案行以"答案:"开头，选项以 A. B. C. D. 开头。')
  }

  const meta = {
    name: bankName || file.name.replace(/\.\w+$/, ''),
    version: '1.0.0',
    total: questions.length,
    categories: stats.categories,
    typeCounts: stats.typeCounts,
  }

  return { meta, questions, stats }
}
