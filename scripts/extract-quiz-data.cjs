// Extract quiz data from project-quiz.html and convert to JSON
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', '..', 'project-quiz.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// Extract JS between <script> tags (the first one after <body>)
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.error('No script tag found'); process.exit(1); }

const js = scriptMatch[1];

// Extract individual arrays using eval-like parsing
function extractArray(js, varName) {
  const regex = new RegExp(`const\\s+${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
  const match = js.match(regex);
  if (!match) return [];
  // Use Function constructor to safely parse
  try {
    return new Function('return [' + match[1] + ']')();
  } catch(e) {
    console.error(`Failed to parse ${varName}:`, e.message);
    return [];
  }
}

const questions = extractArray(js, 'questions');
const judgeQuestions = extractArray(js, 'judgeQuestions');
const fillQuestions = extractArray(js, 'fillQuestions');
const pmpQuestions = extractArray(js, 'pmpQuestions');

console.log(`PM single/multi: ${questions.length}`);
console.log(`PM judge: ${judgeQuestions.length}`);
console.log(`PM fill: ${fillQuestions.length}`);
console.log(`PMP total: ${pmpQuestions.length}`);

// Normalize PM questions: add qType field
const pmAll = [
  ...questions.map(q => ({ ...q, qType: q.type })),
  ...judgeQuestions.map(q => ({ ...q, qType: 'judge' })),
  ...fillQuestions.map(q => ({ ...q, qType: 'fill' })),
];

// Normalize PMP questions: add qType field
const pmpAll = pmpQuestions.map(q => ({ ...q, qType: q.type }));

// Collect categories
const pmCategories = [...new Set(pmAll.map(q => q.category))].sort();
const pmpCategories = [...new Set(pmpAll.map(q => q.category))].sort();

console.log(`\nPM categories: ${pmCategories.join(', ')}`);
console.log(`PMP categories: ${pmpCategories.join(', ')}`);

// Build JSON output
const pmJson = {
  meta: {
    name: "项目管理大赛题库",
    version: "1.0.0",
    total: pmAll.length,
    categories: pmCategories,
    typeCounts: {
      single: pmAll.filter(q => q.qType === 'single').length,
      multi: pmAll.filter(q => q.qType === 'multi').length,
      judge: pmAll.filter(q => q.qType === 'judge').length,
      fill: pmAll.filter(q => q.qType === 'fill').length,
    }
  },
  questions: pmAll
};

const pmpJson = {
  meta: {
    name: "PMP题库",
    version: "1.0.0",
    total: pmpAll.length,
    categories: pmpCategories,
    typeCounts: {
      single: pmpAll.filter(q => q.qType === 'single').length,
      multi: pmpAll.filter(q => q.qType === 'multi').length,
      judge: pmpAll.filter(q => q.qType === 'judge').length,
      fill: pmpAll.filter(q => q.qType === 'fill').length,
    }
  },
  questions: pmpAll
};

// Write JSON files
const outDir = path.join(__dirname, '..', 'public', 'quiz-data');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'pm.json'), JSON.stringify(pmJson, null, 2), 'utf-8');
fs.writeFileSync(path.join(outDir, 'pmp.json'), JSON.stringify(pmpJson, null, 2), 'utf-8');

console.log('\nDone! Files written:');
console.log(`  pm.json: ${pmAll.length} questions`);
console.log(`  pmp.json: ${pmpAll.length} questions`);
