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
import { extractTextFromPdf } from './pdfParser.js'

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
 * @param {Object} [opts] - 可选参数
 * @param {boolean} [opts.requireAnswers=true] - 是否要求必须包含"答案:"行。
 *   单文档模式默认 true；双文档模式（纯题目文档）应传 false。
 * @returns {{ questions: Array, stats: Object }}
 */
export function parseQuestionsFromLines(lines, { requireAnswers = true } = {}) {
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
    let nextQStart = -1
    while (i < n) {
      const curr = lines[i]
      if (/^(正确)?答案\s*[：:]/.test(curr)) {
        answerLineIdx = i
        i++
        break
      }
      if (/^\d{1,3}[.、)\s]/.test(curr) && i > qStart + 1) {
        nextQStart = i
        break
      }
      i++
    }

    // 纯题目模式（无答案行）：用下一题位置或 EOF 作为边界
    if (answerLineIdx === -1 && !requireAnswers) {
      if (nextQStart === -1) nextQStart = n
      answerLineIdx = nextQStart
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
 * 从纯答案文档的文本行中提取答案列表
 * 支持格式：1.B / 1、B / 第1题 B / 1-5 BABDC（批量）
 * @param {string[]} lines
 * @returns {{ answers: Array<{num:number, raw:string}>, warnings: string[] }}
 */
export function parseAnswersFromLines(lines) {
  const answers = []
  const warnings = []

  for (const line of lines) {
    // 尝试批量格式：1-5 BABDC
    const batchMatch = line.match(/^(\d+)\s*[-–—]\s*(\d+)\s+(.+)/)
    if (batchMatch) {
      const start = parseInt(batchMatch[1])
      const end = parseInt(batchMatch[2])
      const chars = batchMatch[3].replace(/\s+/g, '').split('')
      const count = end - start + 1
      if (chars.length < count) {
        warnings.push(`批量答案行长度不足：预期 ${count} 个答案，实际 ${chars.length} 个 → "${line}"`)
      }
      for (let j = 0; j < count; j++) {
        answers.push({ num: start + j, raw: chars[j] || '?' })
      }
      continue
    }

    // 第X题 答案 / 题号X 答案
    const chMatch = line.match(/第?\s*(\d+)\s*题?\s*[：:.\s]+(.+)/)
    if (chMatch) {
      const raw = chMatch[2].trim()
      answers.push({ num: parseInt(chMatch[1]), raw: raw.length > 20 ? raw.slice(0, 20) : raw })
      continue
    }

    // 编号格式：1.B / 1、B / 1) B / 1 B
    const numMatch = line.match(/^(\d+)\s*[.、)\s]\s*(.+)/)
    if (numMatch) {
      const raw = numMatch[2].trim()
      answers.push({ num: parseInt(numMatch[1]), raw: raw.length > 30 ? raw.slice(0, 30) : raw })
      continue
    }
  }

  answers.sort((a, b) => a.num - b.num)

  // 检查连续性
  for (let i = 1; i < answers.length; i++) {
    if (answers[i].num !== answers[i - 1].num + 1) {
      warnings.push(`题号不连续：${answers[i - 1].num} → ${answers[i].num}（预期 ${answers[i - 1].num + 1}）`)
    }
  }

  return { answers, warnings }
}

/**
 * 将答案合并到题目列表中
 * @param {Array} questions - 已解析的题目（可能无答案）
 * @param {Array} answers - parseAnswersFromLines 返回的 answers
 * @returns {{ questions: Array, warnings: string[] }}
 */
export function matchAnswersToQuestions(questions, answers) {
  const warnings = []
  const answerMap = {}
  for (const a of answers) {
    if (answerMap[a.num]) {
      warnings.push(`题号 ${a.num} 有重复答案："${answerMap[a.num]}" 和 "${a.raw}"，使用后者`)
    }
    answerMap[a.num] = normalizeAnswer(a.raw)
  }

  for (let i = 0; i < questions.length; i++) {
    const qNum = i + 1
    if (answerMap[qNum]) {
      questions[i].answer = answerMap[qNum]
    } else {
      questions[i].answer = questions[i].answer || '?'
      warnings.push(`第 ${qNum} 题未在答案文档中找到匹配答案`)
    }
  }

  // 答案多余题目
  const qCount = questions.length
  const extraKeys = Object.keys(answerMap).filter(k => parseInt(k) > qCount)
  if (extraKeys.length > 0) {
    warnings.push(`答案文档有 ${extraKeys.length} 条多余答案（题号 ${extraKeys.join(', ')}），已忽略`)
  }

  return { questions, warnings }
}

/**
 * 标准化答案文本
 */
function normalizeAnswer(raw) {
  const t = raw.trim()
  // 判断/对错 → 标准化
  const trueMap = { '正确': '正确', '对': '正确', '√': '正确', '✓': '正确', '✅': '正确', '是': '正确' }
  const falseMap = { '错误': '错误', '错': '错误', '×': '错误', '✗': '错误', '✘': '错误', '❌': '错误', '否': '错误' }
  if (trueMap[t]) return '正确'
  if (falseMap[t]) return '错误'
  return t
}

// ═══════════════════════════════════════════
//  双语（中英对照）PDF 解析
// ═══════════════════════════════════════════

/**
 * 检测文本是否为中英双语对照格式
 * 判断依据：连续两个区块的题号相同，且一个以英文为主、一个以中文为主
 */
function isBilingualBlocks(blocks) {
  if (blocks.length < 2) return false
  let pairedCount = 0
  for (let i = 0; i < blocks.length - 1; i++) {
    if (blocks[i].num === blocks[i + 1].num) {
      const iEn = cjkRatio(blocks[i].stem) < 0.3
      const jCn = cjkRatio(blocks[i + 1].stem) > 0.3
      if (iEn && jCn) pairedCount++
    }
  }
  // > 30% 的题号成对出现 → 双语
  return pairedCount > blocks.length * 0.15
}

/** 中文字符占比 */
function cjkRatio(text) {
  if (!text) return 0
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  return cjk / Math.max(text.length, 1)
}

/**
 * 从文本行提取原始题目区块（stem + options）
 */
function extractBlocks(lines) {
  const blocks = []
  let i = 0
  const n = lines.length

  while (i < n) {
    const line = lines[i]
    const numMatch = line.match(/^(\d{1,3})[.、)\s]/)
    if (!numMatch) { i++; continue }

    const num = parseInt(numMatch[1])
    const blockStart = i
    i++

    // 收集区块行，直到下一个题号或 EOF
    while (i < n) {
      if (/^\d{1,3}[.、)\s]/.test(lines[i])) break
      i++
    }

    const blockLines = lines.slice(blockStart, i)
    const { stem, options } = extractBlockContent(blockLines)

    if (stem) {
      blocks.push({ num, stem, options, rawLines: blockLines })
    }
  }

  return blocks
}

/**
 * 从区块内的多行中提取题干和选项
 * 处理 PDF 的单行多选项格式：A.xxx B.xxx C.xxx D.xxx
 */
function extractBlockContent(blockLines) {
  const stemParts = []
  const options = []

  for (const line of blockLines) {
    // 检查是否整行都是选项（包含多个 A. B. C. D.）
    const multiOpt = splitMultiOptionLine(line)
    if (multiOpt && multiOpt.length >= 2) {
      for (const o of multiOpt) {
        if (!options.find(e => e.label === o.label)) {
          options.push(o)
        }
      }
      continue
    }

    // 单行选项
    const optMatch = line.match(/^([A-F])[.、)\s]\s*(.+)/)
    if (optMatch) {
      const entry = { label: optMatch[1], text: optMatch[2].trim() }
      if (!options.find(e => e.label === entry.label)) {
        options.push(entry)
      }
      continue
    }

    // 否则当作题干的一部分
    const cleaned = line.replace(/^\d{1,3}[.、)\s]\s*/, '').replace(/^第?\d{1,3}题[.、:\s]*/, '')
    if (cleaned) stemParts.push(cleaned)
  }

  return { stem: stemParts.join(' '), options }
}

/**
 * 拆分单行多选项：A.xxx B.xxx C.xxx D.xxx
 * 对英文选项（间距大，如 "A.xxx    B.xxx"）和中文选项都适用
 */
function splitMultiOptionLine(line) {
  // 尝试按大写字母+标点分割
  const parts = line.split(/(?=[A-F][.、]\s)/).filter(Boolean)
  if (parts.length < 2) return null

  const results = []
  for (const p of parts) {
    const m = p.match(/^([A-F])[.、]\s*(.*)/)
    if (m) results.push({ label: m[1], text: m[2].trim() })
  }
  return results.length >= 2 ? results : null
}

/**
 * 合并双语区块为一个题目对象
 */
function mergeBilingualBlocks(blocks) {
  const questions = []
  const used = new Set()

  for (let i = 0; i < blocks.length; i++) {
    if (used.has(i)) continue

    const a = blocks[i]
    const aIsCn = cjkRatio(a.stem) > 0.3

    // 看下一个区块是否同题号 + 异语言
    if (i + 1 < blocks.length && blocks[i + 1].num === a.num) {
      const b = blocks[i + 1]
      const bIsCn = cjkRatio(b.stem) > 0.3

      if (aIsCn !== bIsCn) {
        // 双语对
        const enBlock = aIsCn ? b : a
        const cnBlock = aIsCn ? a : b

        const qType = classifyQuestionTypeFromOptions(cnBlock.options, cnBlock.stem)
        const enOptTexts = enBlock.options.map(o => o.text)
        const cnOptTexts = cnBlock.options.map(o => o.text)

        questions.push({
          stemEn: enBlock.stem,
          stemCn: cnBlock.stem,
          optionsEn: enBlock.options,
          optionsCn: cnBlock.options,
          // 向后兼容字段（用中文版）
          q: cnBlock.stem,
          options: cnOptTexts,
          answer: '?',
          explain: '',
          category: extractCategory(cnBlock.stem),
          type: qType,
          bilingual: true,
        })

        used.add(i)
        used.add(i + 1)
        i++ // skip b
        continue
      }
    }

    // 不成对 → 当作普通题
    questions.push({
      q: a.stem,
      options: a.options.map(o => o.text),
      answer: '?',
      explain: '',
      category: extractCategory(a.stem),
      type: classifyQuestionTypeFromOptions(a.options, a.stem),
      bilingual: false,
    })
    used.add(i)
  }

  return questions
}

/** 根据选项和题干判断题型 */
function classifyQuestionTypeFromOptions(options, stem) {
  if (cjkRatio(stem) > 0.3) {
    if (/哪些|以下哪些|多项|多选题|不属于|不属于以下/.test(stem)) return 'multi'
  } else {
    if (/which of the following|not include|except/i.test(stem)) return 'multi'
  }
  if (options.length >= 5) return 'multi'
  return 'single'
}

/**
 * 解析双语对照文本（中英各一套的 PDF）
 * @param {string[]} lines
 * @returns {{ questions: Array, stats: Object, bilingual: boolean }}
 */
export function parseBilingualLines(lines) {
  const blocks = extractBlocks(lines)

  if (!isBilingualBlocks(blocks)) {
    // 不是双语 → 走普通解析
    const result = parseQuestionsFromLines(lines)
    return { ...result, bilingual: false }
  }

  const questions = mergeBilingualBlocks(blocks)

  const typeCounts = {}
  const categories = new Set()
  for (const q of questions) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1
    categories.add(q.category)
  }

  return {
    questions,
    stats: { total: questions.length, typeCounts, categories: [...categories] },
    bilingual: true,
  }
}

/**
 * 主函数：解析 PDF 文件，返回完整题库数据
 * 自动检测双语模式
 * @param {File} file
 * @param {string} bankName
 * @returns {Promise<{ meta: Object, questions: Array, stats: Object }>}
 */
export async function parsePdfFile(file, bankName) {
  const lines = await extractTextFromPdf(file)

  // 优先尝试双语解析
  const bilingualResult = parseBilingualLines(lines)

  let questions, stats, bilingual
  if (bilingualResult.bilingual && bilingualResult.questions.length > 0) {
    questions = bilingualResult.questions
    stats = bilingualResult.stats
    bilingual = true
  } else {
    // 回退普通解析
    const normalResult = parseQuestionsFromLines(lines)
    questions = normalResult.questions
    stats = normalResult.stats
    bilingual = false
  }

  if (questions.length === 0) {
    throw new Error(
      '未检测到题目格式。\n\n' +
      '请确保PDF中每题以数字编号开头（如 "1."、"1、"），答案行以"答案:"开头，选项以 A. B. C. D. 开头。'
    )
  }

  const meta = {
    name: bankName || file.name.replace(/\.\w+$/, ''),
    version: '1.0.0',
    total: questions.length,
    categories: stats.categories,
    typeCounts: stats.typeCounts,
    bilingual: !!bilingual,
  }

  return { meta, questions, stats }
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
