/**
 * useHistory composable
 * 做题历史记录
 */
import { ref, computed, watch } from 'vue';
import { useBank } from './useBank.js';

const MAX_HISTORY = 50; // 最多保留最近50条

/**
 * 做题历史 composable
 * @returns {Object}
 */
export function useHistory() {
  const { currentBank } = useBank();

  // 从 localStorage 加载历史
  const loadHistory = () => {
    const stored = localStorage.getItem(`${currentBank.value}_history`);
    return stored ? JSON.parse(stored) : [];
  };

  const history = ref(loadHistory());

  // 切换题库时重新加载
  watch(currentBank, () => {
    history.value = loadHistory();
  });

  // 持久化
  watch(
    history,
    (newVal) => {
      localStorage.setItem(`${currentBank.value}_history`, JSON.stringify(newVal));
    },
    { deep: true }
  );

  /**
   * 添加历史记录
   * @param {Object} question - 题目对象
   * @param {boolean|null} isCorrect - 是否正确（填空题为null）
   */
  function addHistory(question, isCorrect) {
    const entry = {
      qId: question.qId || question.id,
      question: {
        question: question.question,
        type: question.type,
        category: question.category
      },
      isCorrect,
      timestamp: Date.now()
    };

    history.value.unshift(entry);

    // 限制数量
    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(0, MAX_HISTORY);
    }
  }

  /**
   * 清空历史
   */
  function clearHistory() {
    history.value = [];
  }

  /**
   * 获取历史记录数量
   */
  const historyCount = computed(() => history.value.length);

  /**
   * 获取最近的正确率
   */
  const recentAccuracy = computed(() => {
    const recent = history.value.slice(0, 10);
    if (recent.length === 0) return null;

    const answered = recent.filter(h => h.isCorrect !== null);
    if (answered.length === 0) return null;

    const correct = answered.filter(h => h.isCorrect === true).length;
    return Math.round((correct / answered.length) * 100);
  });

  /**
   * 获取指定时间范围内的历史
   * @param {number} hours - 过去几小时
   */
  function getHistoryInRange(hours) {
    const now = Date.now();
    const cutoff = now - hours * 60 * 60 * 1000;
    return history.value.filter(h => h.timestamp >= cutoff);
  }

  return {
    history,
    historyCount,
    recentAccuracy,
    addHistory,
    clearHistory,
    getHistoryInRange,
  };
}
