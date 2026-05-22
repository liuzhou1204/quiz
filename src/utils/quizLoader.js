/**
 * 题库加载器（运行时动态 fetch，数据与代码分离）
 *
 * 工作原理：
 * 1. 首次调用 loadManifest() 从 data/manifest.json 获取题库清单
 * 2. 调用 loadQuizBank(id) 按需 fetch 对应的 data/{id}.json
 * 3. 已加载的题库缓存在内存中，避免重复请求
 */

const BASE = import.meta.env.BASE_URL || './'
const cachedBanks = {}
let cachedManifest = null

/**
 * 加载题库清单
 * @returns {Promise<{ banks: Array<{ id: string, name: string, file: string, total: number }> }>}
 */
export async function loadManifest() {
  if (cachedManifest) return cachedManifest
  const res = await fetch(`${BASE}data/manifest.json`)
  if (!res.ok) throw new Error(`无法加载题库清单 (${res.status})`)
  cachedManifest = await res.json()
  return cachedManifest
}

/**
 * 按需加载指定题库（含缓存）
 * @param {string} bankId - 题库 ID（如 'pm', 'pmp'）
 * @returns {Promise<{ meta: object, questions: array }>}
 */
export async function loadQuizBank(bankId) {
  if (cachedBanks[bankId]) return cachedBanks[bankId]

  const manifest = await loadManifest()
  const info = manifest.banks.find(b => b.id === bankId)
  if (!info) throw new Error(`未知题库: ${bankId}`)

  const res = await fetch(`${BASE}data/${info.file}`)
  if (!res.ok) throw new Error(`无法加载题库 ${bankId} (${res.status})`)
  const data = await res.json()
  cachedBanks[bankId] = data
  return data
}

/**
 * 清除缓存（开发调试用）
 */
export function clearCache() {
  for (const key of Object.keys(cachedBanks)) {
    delete cachedBanks[key]
  }
  cachedManifest = null
}
