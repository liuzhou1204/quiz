/**
 * 判断是否在微信内置浏览器中打开
 */
export function isWeChatBrowser() {
  const ua = navigator.userAgent.toLowerCase()
  return /micromessenger/i.test(ua)
}

/**
 * HTML 转义
 */
export function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 基于题干+答案生成稳定的题目唯一 ID
 * 使用简单 djb2 哈希算法
 */
export function getQuestionId(question) {
  const str = (question.q || '') + '|' + (question.answer || '')
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  return 'q_' + Math.abs(hash).toString(36)
}

/**
 * 格式化时间
 */
export function formatTime(date) {
  const d = date || new Date()
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 格式化日期
 */
export function formatDate(date) {
  const d = date || new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
