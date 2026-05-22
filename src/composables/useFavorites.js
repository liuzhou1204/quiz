/**
 * useFavorites composable
 * 收藏功能
 */
import { ref, computed, watch } from 'vue';
import { useBank } from './useBank.js';

/**
 * 收藏功能 composable
 * @returns {Object}
 */
export function useFavorites() {
  const { currentBank } = useBank();

  // 从 localStorage 加载收藏
  const stored = localStorage.getItem(`${currentBank.value}_favorites`);
  const favorites = ref(new Set(stored ? JSON.parse(stored) : []));

  // 收藏夹筛选
  const favFilterEnabled = ref(false);

  // 切换题库时重新加载收藏
  watch(currentBank, () => {
    const stored = localStorage.getItem(`${currentBank.value}_favorites`);
    favorites.value = new Set(stored ? JSON.parse(stored) : []);
  });

  // 监听收藏变化并持久化
  watch(
    favorites,
    (newVal) => {
      if (newVal.size === 0) {
        localStorage.removeItem(`${currentBank.value}_favorites`);
      } else {
        localStorage.setItem(`${currentBank.value}_favorites`, JSON.stringify([...newVal]));
      }
    },
    { deep: true }
  );

  /**
   * 切换收藏状态
   * @param {string} qId - 题目ID
   */
  function toggleFavorite(qId) {
    if (favorites.value.has(qId)) {
      favorites.value.delete(qId);
    } else {
      favorites.value.add(qId);
    }
    // 触发响应式更新
    favorites.value = new Set(favorites.value);
  }

  /**
   * 检查是否已收藏
   * @param {string} qId
   * @returns {boolean}
   */
  function isFavorite(qId) {
    return favorites.value.has(qId);
  }

  /**
   * 切换收藏夹筛选
   */
  function toggleFavFilter() {
    favFilterEnabled.value = !favFilterEnabled.value;
  }

  /**
   * 获取收藏数量
   */
  const favoriteCount = computed(() => favorites.value.size);

  /**
   * 清除所有收藏
   */
  function clearFavorites() {
    favorites.value = new Set();
  }

  /**
   * 添加收藏
   * @param {string} qId
   */
  function addFavorite(qId) {
    if (!favorites.value.has(qId)) {
      favorites.value.add(qId);
      favorites.value = new Set(favorites.value);
    }
  }

  /**
   * 移除收藏
   * @param {string} qId
   */
  function removeFavorite(qId) {
    if (favorites.value.has(qId)) {
      favorites.value.delete(qId);
      favorites.value = new Set(favorites.value);
    }
  }

  return {
    favorites,
    favFilterEnabled,
    favoriteCount,
    toggleFavorite,
    isFavorite,
    toggleFavFilter,
    clearFavorites,
    addFavorite,
    removeFavorite,
  };
}
