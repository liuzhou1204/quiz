/**
 * useWrongBook composable
 * 错题本功能
 */
import { ref, computed, watch } from 'vue';
import { useBank } from './useBank.js';
import { getQuestionId } from '../utils/helpers.js';

/**
 * 错题本 composable
 * @returns {Object}
 */
export function useWrongBook() {
  const { currentBank } = useBank();

  // 从 localStorage 加载错题本
  const loadWrongBook = () => {
    const stored = localStorage.getItem(`${currentBank.value}_wrongBook`);
    return stored ? JSON.parse(stored) : [];
  };

  const wrongBook = ref(loadWrongBook());

  // 练习模式
  const practiceMode = ref(false);
  const practiceList = ref([]);
  const practiceIndex = ref(0);

  // 切换题库时重新加载
  watch(currentBank, () => {
    wrongBook.value = loadWrongBook();
    practiceMode.value = false;
    practiceList.value = [];
    practiceIndex.value = 0;
  });

  // 持久化
  watch(
    wrongBook,
    (newVal) => {
      localStorage.setItem(`${currentBank.value}_wrongBook`, JSON.stringify(newVal));
    },
    { deep: true }
  );

  /**
   * 添加到错题本
   * @param {Object} question - 题目对象
   */
  function addToWrongBook(question) {
    const qId = getQuestionId(question);

    // 检查是否已存在
    const existing = wrongBook.value.find(item => item.qId === qId);
    if (existing) {
      // 更新错误次数和时间
      existing.wrongCount++;
      existing.timestamp = Date.now();
    } else {
      // 新增
      wrongBook.value.push({
        qId,
        question,
        wrongCount: 1,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 从错题本移除
   * @param {string} qId
   */
  function removeFromWrongBook(qId) {
    const idx = wrongBook.value.findIndex(item => item.qId === qId);
    if (idx > -1) {
      wrongBook.value.splice(idx, 1);
    }
  }

  /**
   * 检查是否在错题本中
   * @param {string} qId
   * @returns {boolean}
   */
  function isInWrongBook(qId) {
    return wrongBook.value.some(item => item.qId === qId);
  }

  /**
   * 获取错题数量
   */
  const wrongCount = computed(() => wrongBook.value.length);

  /**
   * 清空错题本
   */
  function clearWrongBook() {
    wrongBook.value = [];
    practiceMode.value = false;
    practiceList.value = [];
    practiceIndex.value = 0;
  }

  /**
   * 开始练习模式
   */
  function startPractice() {
    if (wrongBook.value.length === 0) return;

    practiceList.value = [...wrongBook.value];
    practiceIndex.value = 0;
    practiceMode.value = true;
  }

  /**
   * 练习提交后，下一题
   */
  function nextPractice() {
    if (practiceIndex.value < practiceList.value.length - 1) {
      practiceIndex.value++;
    } else {
      // 练习结束
      practiceMode.value = false;
    }
  }

  /**
   * 获取当前练习题目
   */
  const currentPracticeQuestion = computed(() => {
    if (!practiceMode.value || practiceList.value.length === 0) return null;
    return practiceList.value[practiceIndex.value]?.question || null;
  });

  /**
   * 从错题本移除做对的题
   * @param {string} qId
   */
  function removeIfCorrect(qId) {
    removeFromWrongBook(qId);
  }

  return {
    wrongBook,
    practiceMode,
    practiceList,
    practiceIndex,
    currentPracticeQuestion,
    wrongCount,
    addToWrongBook,
    removeFromWrongBook,
    isInWrongBook,
    clearWrongBook,
    startPractice,
    nextPractice,
    removeIfCorrect,
  };
}
