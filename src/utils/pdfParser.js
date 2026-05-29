/**
 * pdfParser.js - 浏览器端 PDF 文本提取
 *
 * 通过 CDN 动态加载 pdf.js，避免 npm 安装的 node-canvas 依赖问题。
 * 提取文本后复用 docParser.js 的题目解析逻辑。
 */

let pdfjsLib = null

/**
 * 动态加载 pdf.js 库（CDN）
 */
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      pdfjsLib = window.pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      resolve(pdfjsLib)
    }
    script.onerror = () => reject(new Error('加载 PDF 解析库失败，请检查网络连接'))
    document.head.appendChild(script)
  })
}

/**
 * 从 PDF 文件中提取纯文本行
 * @param {File} file - 用户上传的 PDF 文件
 * @returns {Promise<string[]>} 文本行数组
 */
export async function extractTextFromPdf(file) {
  const lib = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise

  const allLines = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // 按 Y 坐标分行（同一行的文本合并）
    const pageLines = []
    let currentLine = []
    let lastY = null

    for (const item of content.items) {
      const y = item.transform[5]
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        if (currentLine.length > 0) {
          pageLines.push(currentLine.join(' '))
          currentLine = []
        }
      }
      if (item.str && item.str.trim()) {
        currentLine.push(item.str.trim())
      }
      lastY = y
    }

    if (currentLine.length > 0) {
      pageLines.push(currentLine.join(' '))
    }

    allLines.push(...pageLines)
  }

  // 过滤空行
  return allLines.filter(l => l.trim().length > 0)
}
