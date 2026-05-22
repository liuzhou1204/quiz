/**
 * useBank composable
 * 题库管理：切换、加载、筛选
 */
import { ref, computed } from 'vue';
import { loadQuizBank } from '../utils/quizLoader.js';

// 共享状态（模块级别单例）
const currentBank = ref('pm'); // 'pm' | 'pmp'
const bankMeta = ref(null);
const bankQuestions = ref([]);

/**
 * 题库管理 composable
 * @returns {Object}
 */
export function useBank() {
  const loading = ref(false);
  const error = ref(null);

  /**
   * 加载指定题库
   * @param {string} bankId
   */
  function loadBank(bankId) {
    loading.value = true;
    error.value = null;

    try {
      const data = loadQuizBank(bankId);
      bankMeta.value = data.meta;
      bankQuestions.value = data.questions;
      currentBank.value = bankId;
    } catch (e) {
      error.value = e.message;
      console.error(`Failed to load bank ${bankId}:`, e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 切换题库
   * @param {string} bankId
   */
  function switchBank(bankId) {
    if (bankId !== currentBank.value) {
      loadBank(bankId);
    }
  }

  /**
   * 获取分类列表（包含"全部"选项）
   */
  const categories = computed(() => {
    if (!bankMeta.value) return ['全部'];
    return ['全部', ...bankMeta.value.categories];
  });

  /**
   * 各类型题目数量统计
   */
  const typeCounts = computed(() => {
    return bankMeta.value?.typeCounts || {};
  });

  /**
   * 总题目数
   */
  const totalCount = computed(() => {
    return bankQuestions.value.length;
  });

  return {
    currentBank,
    bankMeta,
    bankQuestions,
    loading,
    error,
    categories,
    typeCounts,
    totalCount,
    switchBank,
    loadBank,
  };
}
