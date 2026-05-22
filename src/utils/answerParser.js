/**
 * 答案解析与判题工具
 *
 * 支持的格式：
 * - 高项多选: "A,B,C" (逗号分隔)
 * - PMP多选: "ABCD" (连续字母)
 * - 高项判断: "正确"/"错误"
 * - PMP判断: "对"/"错"
 */

/**
 * 解析答案为 Set 格式用于比较
 * @param {string} answer - 原始答案字符串
 * @param {string} type - 题目类型: 'single'|'multi'|'judge'|'fill'
 * @returns {Set<string>}
 */
export function parseAnswer(answer, type) {
  if (type === 'judge') {
    const a = answer.trim();
    return new Set([a]);
  }

  if (type === 'fill') {
    return new Set([answer.trim()]);
  }

  // single/multi: 解析为字母集合
  const trimmed = answer.trim().toUpperCase();

  // 检测连续字母格式如 "ABCD"（多选）
  if (/^[A-Z]{2,}$/.test(trimmed)) {
    return new Set(trimmed.split(''));
  }

  // 逗号分隔 "A,B,C"
  return new Set(trimmed.split(',').map(s => s.trim()).filter(Boolean));
}

/**
 * 检查答案是否正确
 * @param {Object} question - 题目对象
 * @param {Array<string>} selectedAnswers - 用户选择的答案数组
 * @returns {Object} { isCorrect: boolean|null, correctAnswer: Set, userAnswer: Set }
 */
export function checkAnswer(question, selectedAnswers) {
  const correct = parseAnswer(question.answer, question.type);
  const selected = new Set(selectedAnswers.map(a => a.toUpperCase().trim()).filter(Boolean));

  // 填空题不评分
  if (question.type === 'fill') {
    return { isCorrect: null, correctAnswer: correct, userAnswer: selected };
  }

  // 判断题：兼容 "正确"/"错误" 和 "对"/"错"
  if (question.type === 'judge') {
    const correctVal = correct.values().next().value;
    const positive = new Set(['正确', '对']);
    const negative = new Set(['错误', '错']);
    const isPositive = positive.has(correctVal);
    const userVal = selected.values().next().value || '';
    const userIsPositive = positive.has(userVal);
    return {
      isCorrect: isPositive === userIsPositive,
      correctAnswer: correct,
      userAnswer: selected
    };
  }

  // 单选/多选
  if (correct.size !== selected.size) {
    return { isCorrect: false, correctAnswer: correct, userAnswer: selected };
  }

  for (const a of correct) {
    if (!selected.has(a)) {
      return { isCorrect: false, correctAnswer: correct, userAnswer: selected };
    }
  }

  return { isCorrect: true, correctAnswer: correct, userAnswer: selected };
}
