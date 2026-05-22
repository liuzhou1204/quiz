/**
 * useLocalStorage composable
 * 将响应式数据持久化到 localStorage
 */
import { ref, watch } from 'vue';

/**
 * 创建持久化的响应式数据
 * @param {string} key - localStorage 键名
 * @param {*} defaultValue - 默认值
 * @returns {Ref}
 */
export function useLocalStorage(key, defaultValue) {
  const stored = localStorage.getItem(key);
  const data = ref(stored !== null ? JSON.parse(stored) : defaultValue);

  watch(
    data,
    (newVal) => {
      if (newVal === null || newVal === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newVal));
      }
    },
    { deep: true }
  );

  return data;
}

/**
 * 创建 Set 类型的 localStorage 持久化数据
 * @param {string} key
 * @returns {Ref<Set>}
 */
export function useLocalStorageSet(key) {
  const stored = localStorage.getItem(key);
  const data = ref(stored !== null ? new Set(JSON.parse(stored)) : new Set());

  watch(
    data,
    (newVal) => {
      if (newVal.size === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify([...newVal]));
      }
    },
    { deep: true }
  );

  return data;
}
