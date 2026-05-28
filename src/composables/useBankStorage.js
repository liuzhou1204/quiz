/**
 * useBankStorage.js - IndexedDB 题库存储
 *
 * 用 IndexedDB 持久化用户上传的动态题库。
 * 支持：添加、列出、读取、删除题库。
 *
 * 数据库：docquiz
 * 对象存储：banks (key: bankId)
 */

const DB_NAME = 'docquiz'
const DB_VERSION = 1
const STORE_NAME = 'banks'

/**
 * 打开数据库
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 保存题库到 IndexedDB
 * @param {{ id: string, name: string, meta: Object, questions: Array, createdAt: string }} bankData
 * @returns {Promise<void>}
 */
export async function saveBank(bankData) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(bankData)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/**
 * 获取所有动态题库列表（不含题目数据，仅元信息）
 * @returns {Promise<Array<{ id: string, name: string, total: number, createdAt: string }>>}
 */
export async function listBanks() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      db.close()
      const banks = request.result.map(b => ({
        id: b.id,
        name: b.name || b.meta?.name || '未命名',
        total: b.meta?.total || b.questions?.length || 0,
        createdAt: b.createdAt || '',
        isDynamic: true,
      }))
      resolve(banks)
    }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

/**
 * 加载指定题库的完整数据（含题目）
 * @param {string} bankId
 * @returns {Promise<{ id: string, meta: Object, questions: Array }>}
 */
export async function loadBank(bankId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(bankId)
    request.onsuccess = () => {
      db.close()
      if (!request.result) {
        reject(new Error(`题库不存在: ${bankId}`))
        return
      }
      const { id, meta, questions } = request.result
      resolve({ id, meta, questions })
    }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

/**
 * 删除题库
 * @param {string} bankId
 * @returns {Promise<void>}
 */
export async function deleteBank(bankId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(bankId)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/**
 * 生成唯一题库 ID
 * @returns {string}
 */
export function generateBankId() {
  return 'dynamic_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}
