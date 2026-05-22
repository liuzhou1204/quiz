/**
 * useStats composable
 * 统计数据与分数历史
 */
import { ref, computed, watch } from 'vue';
import { useBank } from './useBank.js';

/**
 * 统计数据 composable
 * @returns {Object}
 */
export function useStats() {
  const { currentBank, bankQuestions } = useBank();

  // 从 localStorage 加载分数历史
  const loadScoreHistory = () => {
    const stored = localStorage.getItem(`${currentBank.value}_scoreHistory`);
    return stored ? JSON.parse(stored) : [];
  };

  const scoreHistory = ref(loadScoreHistory());

  // 切换题库时重新加载
  watch(currentBank, () => {
    scoreHistory.value = loadScoreHistory();
  });

  // 持久化
  watch(
    scoreHistory,
    (newVal) => {
      localStorage.setItem(`${currentBank.value}_scoreHistory`, JSON.stringify(newVal));
    },
    { deep: true }
  );

  /**
   * 记录当前分数
   * @param {number} correct - 正确数
   * @param {number} total - 总数
   */
  function recordScore(correct, total) {
    const today = new Date().toISOString().split('T')[0];
    const existing = scoreHistory.value.find(s => s.date === today);

    if (existing) {
      // 更新今日记录
      existing.total = total;
      existing.correct = correct;
      existing.wrong = total - correct;
      existing.rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    } else {
      // 新增记录
      scoreHistory.value.unshift({
        date: today,
        total,
        correct,
        wrong: total - correct,
        rate: total > 0 ? Math.round((correct / total) * 100) : 0
      });
    }

    // 只保留最近30天
    if (scoreHistory.value.length > 30) {
      scoreHistory.value = scoreHistory.value.slice(0, 30);
    }
  }

  /**
   * 获取分数历史
   * @returns {Array}
   */
  function getScoreHistory() {
    return [...scoreHistory.value];
  }

  /**
   * 清空所有分数记录
   */
  function clearAllScores() {
    scoreHistory.value = [];
  }

  /**
   * 获取今日统计
   */
  const todayStats = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = scoreHistory.value.find(s => s.date === today);
    return todayRecord || null;
  });

  /**
   * 获取总正确率
   */
  const overallAccuracy = computed(() => {
    if (scoreHistory.value.length === 0) return null;

    const total = scoreHistory.value.reduce((sum, s) => sum + s.total, 0);
    const correct = scoreHistory.value.reduce((sum, s) => sum + s.correct, 0);

    if (total === 0) return null;
    return Math.round((correct / total) * 100);
  });

  /**
   * 获取本周统计
   */
  const weekStats = computed(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const weekRecords = scoreHistory.value.filter(s => {
      const recordTime = new Date(s.date).getTime();
      return recordTime >= weekAgo;
    });

    if (weekRecords.length === 0) {
      return { total: 0, correct: 0, rate: 0 };
    }

    const total = weekRecords.reduce((sum, s) => sum + s.total, 0);
    const correct = weekRecords.reduce((sum, s) => sum + s.correct, 0);

    return {
      total,
      correct,
      rate: total > 0 ? Math.round((correct / total) * 100) : 0
    };
  });

  /**
   * 计算连续学习天数
   */
  const streakDays = computed(() => {
    if (scoreHistory.value.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const hasRecord = scoreHistory.value.some(s => s.date === dateStr);

      if (hasRecord) {
        streak++;
      } else if (i > 0) {
        // 允许今天没有记录（还没开始学习）
        break;
      }
    }

    return streak;
  });

  return {
    scoreHistory,
    todayStats,
    overallAccuracy,
    weekStats,
    streakDays,
    recordScore,
    getScoreHistory,
    clearAllScores,
  };
}
