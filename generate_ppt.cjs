const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "NB & Team (5人)";
pres.title = "DocQuiz 从0到1 创新商业方案";

// ═══════════════════════════════════════
// REFINED COLOR PALETTE — "Midnight Teal"
// ═══════════════════════════════════════
const C = {
  dkNavy:  "0F2B46",  // primary dark
  mdTeal:  "1A6B5A",  // secondary teal
  ltTeal:  "2D9B82",  // light teal
  gold:    "C49B4A",  // accent gold
  dkGold:  "8B6914",  // dark gold for text on light
  white:   "FFFFFF",
  cream:   "F7F4EF",  // warm off-white
  ltCream: "FCFAF7",  // nearly white
  grey:    "6B7280",
  lGrey:   "C4C9D0",
  green:   "0D7C51",
  red:     "C53030",
  amber:   "B7791F",
  purple:  "6B46C8",
  blue:    "2563A8",
  lightGreen: "E6F4EC",
  lightRed:   "FDF0F0",
  lightBlue:  "EBF2FA",
  lightTeal:  "E6F2EF",
  lightGold:  "FBF5EB",
};

// ═══════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════
const cardShape = (s, x, y, w, h, opts = {}) => {
  const fill = opts.fill || C.white;
  const shadow = opts.shadow !== false ? { type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.06 } : undefined;
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, shadow, rectRadius: 0.04, line: opts.line });
};

const sectionPage = (s, color, label, title) => {
  s.background = { color: C.cream };
  // Left accent bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color } });
  // Subtle top bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.03, fill: { color } });
  s.addText(label, { x: 0.5, y: 0.3, w: 9, h: 0.35, fontSize: 11, fontFace: "Calibri", color: C.grey, margin: 0 });
  s.addText(title, { x: 0.5, y: 0.7, w: 9, h: 0.8, fontSize: 34, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });
};

const iconCircle = (s, x, y, size, color, text, fontSize) => {
  s.addShape(pres.shapes.OVAL, { x, y, w: size, h: size, fill: { color } });
  s.addText(text, { x, y, w: size, h: size, fontSize: fontSize || 18, fontFace: "Georgia", bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
};

// ═══════════════════════════════════════
// SLIDE 1 — COVER (dark, premium)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.dkNavy };
  // Left panel overlay
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 4.2, h: 5.625, fill: { color: C.mdTeal, transparency: 30 } });
  // Accent line
  s.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 2.35, w: 1.6, h: 0.04, fill: { color: C.gold } });

  s.addText("DocQuiz", {
    x: 0.9, y: 0.7, w: 8.5, h: 1.1, fontSize: 54, fontFace: "Georgia", bold: true, color: C.white, margin: 0,
  });
  s.addText("一键把文档变成在线练习系统", {
    x: 0.9, y: 1.9, w: 8.5, h: 0.5, fontSize: 20, fontFace: "Calibri", color: C.gold, margin: 0,
  });

  s.addText([
    { text: "从 0 到 1 的新产品构想", options: {} },
    { text: "  ·  赛道 A", options: { color: C.gold } },
  ], { x: 0.9, y: 2.7, w: 8, h: 0.4, fontSize: 16, fontFace: "Calibri", color: C.lGrey, margin: 0 });

  s.addText("华东师范大学  ·  创造性思维与创新管理  ·  小组汇报", {
    x: 0.9, y: 3.9, w: 8, h: 0.35, fontSize: 12, fontFace: "Calibri", color: C.grey, margin: 0,
  });
  s.addText("团队 5 人  |  刘舟（NB）  |  成员 A / B / C / D", {
    x: 0.9, y: 4.35, w: 8, h: 0.35, fontSize: 13, fontFace: "Calibri", color: C.lGrey, margin: 0,
  });
  s.addText("在线体验：liuzhou1204.github.io/quiz/", {
    x: 0.9, y: 4.95, w: 8, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.gold, margin: 0,
  });
})();

// ═══════════════════════════════════════
// SLIDE 2 — TEAM (5 cards, varied)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("团队介绍", { x: 0.5, y: 0.2, w: 9, h: 0.5, fontSize: 26, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });
  s.addText("五人各负责一个模块，覆盖从机会洞察到落地路线的完整产品规划链路", {
    x: 0.5, y: 0.65, w: 9, h: 0.3, fontSize: 12, fontFace: "Calibri", italic: true, color: C.grey, margin: 0,
  });

  const members = [
    { name: "成员 A", role: "用户研究员", mod: "模块一", sub: "机会洞察与问题定义", color: C.blue },
    { name: "成员 B", role: "产品架构师", mod: "模块二", sub: "创新方案的核心阐述", color: C.mdTeal },
    { name: "成员 C", role: "市场分析师", mod: "模块三", sub: "市场竞品与产品优势", color: C.amber },
    { name: "成员 D", role: "商业策略师", mod: "模块四", sub: "商业模式可视化构建", color: C.purple },
    { name: "刘舟 NB", role: "组长 · 项目经理", mod: "模块五", sub: "路线图与可行性分析", color: C.gold },
  ];

  members.forEach((m, i) => {
    const x = 0.3 + i * 1.9;
    const y = 1.2;
    const w = 1.72;
    const isLeader = m.name.includes("NB");

    // Card
    cardShape(s, x, y, w, 3.9, { fill: isLeader ? C.lightGold : C.cream });
    // Color top stripe
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.06, fill: { color: m.color } });

    // Avatar circle
    iconCircle(s, x + 0.36, y + 0.35, 1.0, m.color, m.name.charAt(0), 26);

    // Name
    s.addText(m.name, { x, y: y + 1.5, w, h: 0.35, fontSize: 15, fontFace: "Calibri", bold: true, color: C.dkNavy, align: "center", margin: 0 });
    s.addText(m.role, { x, y: y + 1.82, w, h: 0.25, fontSize: 10, fontFace: "Calibri", color: m.color, align: "center", margin: 0 });

    // Divider
    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.4, y: y + 2.2, w: 0.92, h: 0.01, fill: { color: C.lGrey } });

    s.addText(m.mod, { x, y: y + 2.35, w, h: 0.3, fontSize: 11, fontFace: "Calibri", bold: true, color: C.dkNavy, align: "center", margin: 0 });
    s.addText(m.sub, { x: x + 0.06, y: y + 2.7, w: 1.6, h: 0.75, fontSize: 10, fontFace: "Calibri", color: C.grey, align: "center", margin: 0, valign: "top" });

    // Leader highlight
    if (isLeader) {
      s.addShape(pres.shapes.RECTANGLE, { x: x, y, w, h: 3.9, line: { color: C.gold, width: 1.5 }, rectRadius: 0.04, fill: { color: "000000" }, fill: undefined });
      s.addText("组长", { x: x + 0.86, y: y - 0.1, w: 0.8, h: 0.25, fontSize: 9, fontFace: "Calibri", bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.86, y: y - 0.1, w: 0.8, h: 0.25, fill: { color: C.gold }, rectRadius: 0.02 });
      s.addText("组长", { x: x + 0.86, y: y - 0.1, w: 0.8, h: 0.25, fontSize: 9, fontFace: "Calibri", bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    }
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 5.25, w: 9, h: 0.25, fill: { color: C.lightBlue } });
  s.addText("覆盖用户洞察 — 创新设计 — 市场分析 — 商业模式 — 落地执行的完整创业链路", {
    x: 0.7, y: 5.25, w: 8.6, h: 0.25, fontSize: 10, fontFace: "Calibri", italic: true, color: C.blue, margin: 0, align: "center",
  });
})();

// ═══════════════════════════════════════
// SLIDE 3 — MODULE 1 section
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  sectionPage(s, C.blue, "模块一  ·  成员 A 汇报", "机会洞察与问题定义");

  const metrics = [
    { num: "3 类", label: "核心目标用户", sub: "企业培训  ·  高校教师  ·  备考社群" },
    { num: "15 人", label: "深度用户访谈", sub: "覆盖三类用户的真实声音与场景" },
    { num: "87 份", label: "问卷调研验证", sub: "确认\"私有题库在线化\"是普遍痛点" },
  ];
  metrics.forEach((m, i) => {
    const x = 0.5 + i * 3.15;
    cardShape(s, x, 2.2, 2.9, 2.4, { fill: C.white });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.2, w: 2.9, h: 0.04, fill: { color: C.blue } });
    s.addText(m.num, { x, y: 2.4, w: 2.9, h: 0.7, fontSize: 36, fontFace: "Georgia", bold: true, color: C.blue, align: "center", margin: 0 });
    s.addText(m.label, { x, y: 3.15, w: 2.9, h: 0.3, fontSize: 13, fontFace: "Calibri", bold: true, color: C.dkNavy, align: "center", margin: 0 });
    s.addText(m.sub, { x: x + 0.1, y: 3.55, w: 2.7, h: 0.6, fontSize: 11, fontFace: "Calibri", color: C.grey, align: "center", margin: 0 });
  });
})();

// ═══════════════════════════════════════
// SLIDE 4 — USER PERSONAS (icon + text rows)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.blue } });
  s.addText("共情洞察：三类核心目标用户", { x: 0.5, y: 0.15, w: 9, h: 0.45, fontSize: 22, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });

  const users = [
    { letter: "企", title: "企业培训负责人", scene: "新员工入职考核 · 岗位安全培训 · 技能认证", pain: "手里有题库，要排 IT 3 周才能上线", need: "完全自主操作，不依赖内部技术资源", color: C.blue },
    { letter: "教", title: "高校教师 / 辅导员", scene: "期末复习题库 · 竞赛训练 · 随堂测验", pain: "只会 Word，问卷工具没有题库逻辑", need: "零技术门槛，10 分钟从 Word 到在线练习", color: C.mdTeal },
    { letter: "社", title: "备考社群运营者", scene: "考证社群刷题 · 学习打卡 · 模拟考试", pain: "大平台封闭，不接受私有题库上传", need: "免费或低价的私有题库在线工具", color: C.amber },
  ];

  users.forEach((u, i) => {
    const y = 0.85 + i * 1.55;
    cardShape(s, 0.5, y, 9, 1.35, { fill: C.cream });

    // Icon circle
    iconCircle(s, 0.75, y + 0.18, 0.9, u.color, u.letter, 20);

    // Content columns
    s.addText(u.title, { x: 1.9, y: y + 0.1, w: 4, h: 0.3, fontSize: 16, fontFace: "Calibri", bold: true, color: C.dkNavy, margin: 0 });
    s.addText("场景", { x: 1.9, y: y + 0.45, w: 0.6, h: 0.22, fontSize: 9, fontFace: "Calibri", bold: true, color: C.grey, margin: 0 });
    s.addText(u.scene, { x: 2.55, y: y + 0.45, w: 5.5, h: 0.22, fontSize: 11, fontFace: "Calibri", color: C.dkNavy, margin: 0 });
    s.addText("痛点", { x: 1.9, y: y + 0.72, w: 0.6, h: 0.22, fontSize: 9, fontFace: "Calibri", bold: true, color: C.red, margin: 0 });
    s.addText(u.pain, { x: 2.55, y: y + 0.72, w: 5.5, h: 0.22, fontSize: 11, fontFace: "Calibri", color: C.red, margin: 0 });
    s.addText("需求", { x: 1.9, y: y + 0.99, w: 0.6, h: 0.22, fontSize: 9, fontFace: "Calibri", bold: true, color: C.green, margin: 0 });
    s.addText(u.need, { x: 2.55, y: y + 0.99, w: 5.5, h: 0.22, fontSize: 11, fontFace: "Calibri", color: C.green, margin: 0 });
  });

  // Bottom method note
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 5.1, w: 9, h: 0.32, fill: { color: C.lightBlue } });
  s.addText(`研究方法：15 人深度访谈 + 87 份问卷调研  →  验证了"私有题库无法在线化"是跨用户类型的普遍痛点`, {
    x: 0.7, y: 5.1, w: 8.6, h: 0.32, fontSize: 11, fontFace: "Calibri", italic: true, color: C.blue, margin: 0, align: "center",
  });
})();

// ═══════════════════════════════════════
// SLIDE 5 — CORE PROBLEM (dark, bold)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.dkNavy };
  // Subtle background shapes
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 3, h: 5.625, fill: { color: C.mdTeal, transparency: 40 } });

  s.addText("核心问题", { x: 0.9, y: 0.3, w: 9, h: 0.35, fontSize: 13, fontFace: "Calibri", bold: true, color: C.gold, margin: 0 });
  s.addText([
    { text: "如何让任何一个 ", options: {} },
    { text: "非技术用户", options: { color: C.gold } },
    { text: "，在 ", options: {} },
    { text: "10 分钟", options: { color: C.gold } },
    { text: " 内，\n把一份 Word/PDF 文档，\n变成一套可供他人在线练习的题库？", options: {} },
  ], { x: 0.9, y: 0.85, w: 8.2, h: 2.5, fontSize: 26, fontFace: "Georgia", bold: true, color: C.white, aligT: "left", margin: 0 });

  // Pain points
  const pains = [
    { old: "大题库平台", pain: "内容封闭 · 不可上传私有题库" },
    { old: "通用问卷工具", pain: "没有题库逻辑 · 随机/错题本缺失" },
    { old: "自建开发系统", pain: "门槛高 · 周期长 · 费用贵" },
  ];
  pains.forEach((p, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.1, w: 2.9, h: 1.2, fill: { color: C.dkNavy }, line: { color: C.gold, width: 0.5 } });
    s.addText(p.old, { x, y: 4.2, w: 2.9, h: 0.35, fontSize: 14, fontFace: "Calibri", bold: true, color: C.gold, align: "center", margin: 0 });
    s.addText(p.pain, { x: x + 0.08, y: 4.62, w: 2.74, h: 0.5, fontSize: 11, fontFace: "Calibri", color: C.lGrey, align: "center", margin: 0 });
  });
})();

// ═══════════════════════════════════════
// SLIDE 5B — PRODUCT VISION (dark, brand story)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.dkNavy };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 3.2, h: 5.625, fill: { color: C.mdTeal, transparency: 35 } });

  s.addText("产品愿景", { x: 0.7, y: 0.3, w: 9, h: 0.35, fontSize: 13, fontFace: "Calibri", bold: true, color: C.gold, margin: 0 });
  s.addText("DocQuiz 意味着什么？", {
    x: 0.7, y: 0.8, w: 8, h: 0.5, fontSize: 28, fontFace: "Georgia", bold: true, color: C.white, margin: 0,
  });

  // Name breakdown
  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 1.6, w: 0.04, h: 0.35, fill: { color: C.gold } });
  s.addText([
    { text: "Doc ", options: { color: C.gold, fontSize: 24 } },
    { text: " = Document  文档", options: { color: C.white, fontSize: 20 } },
  ], { x: 0.9, y: 1.6, w: 6, h: 0.35, fontSize: 20, fontFace: "Georgia", color: C.white, margin: 0 });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 2.1, w: 0.04, h: 0.35, fill: { color: C.gold } });
  s.addText([
    { text: "Quiz ", options: { color: C.gold, fontSize: 24 } },
    { text: " = 测验 / 题库", options: { color: C.white, fontSize: 20 } },
  ], { x: 0.9, y: 2.1, w: 6, h: 0.35, fontSize: 20, fontFace: "Georgia", color: C.white, margin: 0 });

  // Tagline
  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 2.75, w: 1.2, h: 0.03, fill: { color: C.gold } });
  s.addText("\"文档变题库\"  —  让任何文档，在几分钟内变成可在线练习的题库", {
    x: 0.7, y: 2.95, w: 8.5, h: 0.4, fontSize: 16, fontFace: "Calibri", italic: true, color: C.lGrey, margin: 0,
  });

  // Three brand pillars
  const pillars = [
    { letter: "简", title: "极简", desc: "拖拽上传，零技术门槛\n不需要开发者，不需要服务器", color: C.ltTeal },
    { letter: "私", title: "私有", desc: "题库 100% 归你所有\n不依赖任何封闭平台", color: C.gold },
    { letter: "智", title: "智能", desc: "AI 自动识别题目格式\n准确率持续迭代提升", color: C.blue },
  ];
  pillars.forEach((p, i) => {
    const x = 0.5 + i * 3.15;
    iconCircle(s, x + 1.0, 3.7, 0.7, p.color, p.letter, 20);
    s.addText(p.title, { x, y: 4.55, w: 2.9, h: 0.28, fontSize: 14, fontFace: "Calibri", bold: true, color: p.color, align: "center", margin: 0 });
    s.addText(p.desc, { x: x + 0.1, y: 4.85, w: 2.7, h: 0.6, fontSize: 10, fontFace: "Calibri", color: C.lGrey, align: "center", margin: 0 });
  });
})();

// ═══════════════════════════════════════
// SLIDE 6 — MODULE 2 section
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  sectionPage(s, C.mdTeal, "模块二  ·  成员 B 汇报", "创新方案的核心阐述");

  const boxes = [
    { label: "价值主张", body: "上传 Word/PDF\n10 分钟拥有你自己的在线题库", color: C.mdTeal, letter: "V" },
    { label: "创新类型", body: "低端颠覆式创新\n从被忽视的\"够用就行\"用户切入", color: C.ltTeal, letter: "D" },
    { label: "核心壁垒", body: "AI 解析引擎\n唯一的\"文档→题库\"自动化方案", color: C.gold, letter: "M" },
  ];
  boxes.forEach((b, i) => {
    const x = 0.5 + i * 3.15;
    cardShape(s, x, 2.1, 2.9, 2.3, { fill: C.white });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.1, w: 2.9, h: 0.04, fill: { color: b.color } });
    iconCircle(s, x + 1.0, 2.3, 0.7, b.color, b.letter, 20);
    s.addText(b.label, { x, y: 3.2, w: 2.9, h: 0.28, fontSize: 12, fontFace: "Calibri", bold: true, color: b.color, align: "center", margin: 0 });
    s.addText(b.body, { x: x + 0.1, y: 3.55, w: 2.7, h: 0.7, fontSize: 14, fontFace: "Calibri", color: C.dkNavy, align: "center", margin: 0 });
  });

  s.addText("创新论证核心：AI 解决\"内容格式转换\"最大阻力 — 技术上不难，但产品上从未有人专门做好。这就是窗口。", {
    x: 0.5, y: 4.7, w: 9, h: 0.6, fontSize: 13, fontFace: "Calibri", italic: true, color: C.mdTeal, align: "center", margin: 0,
  });
})();

// ═══════════════════════════════════════
// SLIDE 7 — THREE-STEP PROCESS
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.mdTeal } });
  s.addText("DocQuiz 三步核心流程", { x: 0.5, y: 0.15, w: 9, h: 0.5, fontSize: 24, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });

  const steps = [
    { num: "1", title: "上传文档", body: "拖拽上传 Word / PDF\n支持批量导入\n自动识别格式", color: C.blue },
    { num: "2", title: "AI 自动解析", body: "识别题目类型\n提取选项 + 正确答案\n兼容多种排版格式", color: C.mdTeal },
    { num: "3", title: "一键发布", body: "生成在线练习页面\n随机出题 + 答题统计\n获得分享链接", color: C.gold },
  ];
  steps.forEach((st, i) => {
    const x = 0.5 + i * 3.15;
    cardShape(s, x, 0.85, 2.9, 2.6, { fill: C.cream });
    iconCircle(s, x + 0.85, 1.05, 1.1, st.color, st.num, 28);
    s.addText(st.title, { x, y: 2.35, w: 2.9, h: 0.35, fontSize: 19, fontFace: "Calibri", bold: true, color: C.dkNavy, align: "center", margin: 0 });
    s.addText(st.body, { x: x + 0.1, y: 2.75, w: 2.7, h: 0.6, fontSize: 11, fontFace: "Calibri", color: C.grey, align: "center", margin: 0 });
    if (i < 2) {
      s.addText("→", { x: x + 2.9, y: 1.4, w: 0.4, h: 0.4, fontSize: 24, fontFace: "Calibri", bold: true, color: C.mdTeal, align: "center", margin: 0 });
    }
  });

  // MVP status
  cardShape(s, 0.5, 3.8, 9, 1.55, { fill: C.lightTeal });
  s.addText("MVP 已实现  —  在线验证：liuzhou1204.github.io/quiz/", { x: 0.7, y: 3.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Calibri", bold: true, color: C.mdTeal, margin: 0 });
  const mvpItems = [
    "docx_to_json.py — Word/PDF 自动解析", "Vue 3 练习页面 — 多题库切换",
    "GitHub Pages 部署 — 零服务器成本", "项目管理大赛实际使用验证",
  ];
  mvpItems.forEach((item, j) => {
    s.addText("  " + item, { x: 0.7 + (j % 2) * 4.4, y: 4.3 + Math.floor(j / 2) * 0.38, w: 4.2, h: 0.32, fontSize: 11, fontFace: "Calibri", color: C.dkNavy, margin: 0 });
  });
})();

// ═══════════════════════════════════════
// SLIDE 7B — FIVE-STEP USER FLOW (detailed)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.mdTeal } });
  s.addText("DocQuiz 使用流程  —  从文档到题库只需 5 步", { x: 0.5, y: 0.1, w: 9, h: 0.4, fontSize: 20, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });
  s.addText("打开网页即可完成全部操作，无需安装任何软件，无需任何技术背景", {
    x: 0.5, y: 0.52, w: 9, h: 0.22, fontSize: 10, fontFace: "Calibri", italic: true, color: C.grey, margin: 0,
  });

  const steps = [
    { num: "1", title: "丢入文档", desc: "拖拽或点击上传\nWord / PDF 文件", color: C.blue, icon: "D" },
    { num: "2", title: "AI 解析", desc: "自动识别题目格式\n提取题干+选项+答案", color: C.mdTeal, icon: "A" },
    { num: "3", title: "预览微调", desc: "逐题预览确认\n支持手动修正", color: C.ltTeal, icon: "E" },
    { num: "4", title: "一键上线", desc: "保存到个人题库\n即刻生成练习页面", color: C.amber, icon: "P" },
    { num: "5", title: "刷题分享", desc: "随机出题 + 答题统计\n链接一键分享", color: C.purple, icon: "S" },
  ];

  // Horizontal flow
  steps.forEach((st, i) => {
    const x = 0.2 + i * 1.92;
    cardShape(s, x, 1.0, 1.72, 1.85, { fill: C.cream });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.0, w: 1.72, h: 0.04, fill: { color: st.color } });
    iconCircle(s, x + 0.46, 1.15, 0.7, st.color, st.num, 18);
    s.addText(st.title, { x, y: 1.95, w: 1.72, h: 0.3, fontSize: 13, fontFace: "Calibri", bold: true, color: C.dkNavy, align: "center", margin: 0 });
    s.addText(st.desc, { x: x + 0.06, y: 2.28, w: 1.6, h: 0.5, fontSize: 9, fontFace: "Calibri", color: C.grey, align: "center", margin: 0 });

    // Arrow between steps
    if (i < 4) {
      s.addText(">", { x: x + 1.72, y: 1.3, w: 0.2, h: 0.3, fontSize: 18, fontFace: "Calibri", bold: true, color: C.mdTeal, align: "center", margin: 0 });
    }
  });

  // Bottom: Before vs After comparison
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 3.2, w: 9.4, h: 0.02, fill: { color: C.lGrey } });

  // Before
  cardShape(s, 0.3, 3.4, 4.5, 1.8, { fill: C.lightRed });
  s.addText("改造前（开发者操作）", { x: 0.5, y: 3.45, w: 4, h: 0.25, fontSize: 11, fontFace: "Calibri", bold: true, color: C.red, margin: 0 });
  const beforeItems = [
    "打开终端 → 运行 python docx_to_json.py",
    "手动编辑 manifest.json 注册题库",
    "npm run build 重新构建",
    "重新部署到 GitHub Pages",
  ];
  beforeItems.forEach((item, j) => {
    s.addText("  " + item, { x: 0.5, y: 3.75 + j * 0.35, w: 4.1, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.dkNavy, margin: 0 });
  });

  // After
  cardShape(s, 5.2, 3.4, 4.5, 1.8, { fill: C.lightGreen });
  s.addText("改造后（任何人可用）", { x: 5.4, y: 3.45, w: 4, h: 0.25, fontSize: 11, fontFace: "Calibri", bold: true, color: C.green, margin: 0 });
  const afterItems = [
    "打开 DocQuiz 网页 → 拖入文档",
    "系统自动解析 + 预览确认",
    "点击保存，题库即刻上线",
    "获得分享链接，立即可用",
  ];
  afterItems.forEach((item, j) => {
    s.addText("  " + item, { x: 5.4, y: 3.75 + j * 0.35, w: 4.1, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.dkNavy, margin: 0 });
  });

  s.addText("全程 2 分钟，零代码，零部署", {
    x: 5.4, y: 5.05, w: 4, h: 0.22, fontSize: 12, fontFace: "Calibri", bold: true, color: C.green, margin: 0,
  });
})();

// ═══════════════════════════════════════
// SLIDE 8 — DISRUPTIVE INNOVATION MATRIX
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.mdTeal } });
  s.addText("颠覆性创新矩阵  ·  六维度对比", { x: 0.5, y: 0.1, w: 9, h: 0.4, fontSize: 20, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });
  s.addText("克里斯滕森 Low-end Disruption 理论应用 — 从被忽视的底部市场切入，逐步向上蚕食", {
    x: 0.5, y: 0.55, w: 9, h: 0.25, fontSize: 10, fontFace: "Calibri", italic: true, color: C.grey, margin: 0 });

  const hdr = (txt, bg) => ({ text: txt, options: { fill: { color: bg || C.dkNavy }, color: C.white, bold: true, fontSize: 10, fontFace: "Calibri", align: "center", valign: "middle" } });
  const cel = (txt, color) => ({ text: txt, options: { fontSize: 10, fontFace: "Calibri", color: color || C.dkNavy, valign: "middle", align: "center" } });
  const celB = (txt, color) => ({ text: txt, options: { ...cel(txt, color || C.mdTeal).options, bold: true } });

  const rows = [
    [hdr("创新维度"), hdr("大题库平台（猿题库 / 粉笔）"), hdr("DocQuiz 创新方案", C.gold)],
    [celB("目标客户"), cel("个人备考者"), celB("培训负责人 · 教师 · 社群运营者")],
    [celB("性能指标"), cel("题量大、功能全但复杂", C.grey), celB("10 分钟上手，零技术门槛", C.mdTeal)],
    [celB("成本结构"), cel("会员订阅制，年费数百元", C.grey), celB("开源免费 / 低价订阅", C.mdTeal)],
    [celB("内容开放度"), cel("封闭平台，不可上传私有题库", C.red), celB("100% 私有题库，用户完全自主", C.green)],
    [celB("分发方式"), cel("应用商店 / 广告投放", C.grey), celB("开源口碑 · 社群裂变", C.mdTeal)],
    [celB("用户控制权"), cel("平台控制内容", C.grey), celB("用户完全自主控制", C.mdTeal)],
  ];

  s.addTable(rows, {
    x: 0.3, y: 1.0, w: 9.4,
    colW: [2.0, 3.5, 3.9],
    border: { pt: 0.3, color: C.lGrey },
    rowH: [0.4, 0.42, 0.42, 0.42, 0.45, 0.42, 0.42],
    autoPage: false,
  });

  // Bottom explanation
  cardShape(s, 0.3, 4.15, 9.4, 1.2, { fill: C.lightTeal });
  s.addText("颠覆性逻辑", { x: 0.5, y: 4.2, w: 2, h: 0.3, fontSize: 12, fontFace: "Calibri", bold: true, color: C.mdTeal, margin: 0 });
  s.addText([
    { text: "大平台\"过度服务\"（功能堆叠、价格高、内容封闭）", options: { bold: true, color: C.red } },
    { text: "  →  我们从底部切入：那些\"够用就行、自己控制内容、不想花钱\"的用户  →  极简体验 + 极低成本  →  逐步向上蚕食", options: {} },
  ], { x: 0.5, y: 4.55, w: 9, h: 0.7, fontSize: 11, fontFace: "Calibri", color: C.dkNavy, margin: 0 });
})();

// ═══════════════════════════════════════
// SLIDE 9 — WHY DISRUPTIVE (dark, 3 reasons)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.dkNavy };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 2.5, h: 5.625, fill: { color: C.mdTeal, transparency: 35 } });

  s.addText("为什么具有颠覆性？", { x: 0.7, y: 0.3, w: 9, h: 0.45, fontSize: 16, fontFace: "Calibri", bold: true, color: C.gold, margin: 0 });

  const reasons = [
    { num: "01", title: "唯一的自动化方案", body: "全市场扫描：没有任何竞品提供\"上传 Word/PDF → 自动生成在线题库\"能力。我们是第一且唯一的方案，享受先行者优势。" },
    { num: "02", title: "大厂不会做", body: "大题库平台与封闭内容模式冲突（他们卖的就是题库）；问卷工具不在核心路径（他们卖的是表单）→ 形成结构性机会窗口。" },
    { num: "03", title: "AI 降维打击", body: "过去解析 Word 题库需人工逐题录入，现在 AI 自动完成。技术不新，但产品化是首次。壁垒随时间积累越来越厚。" },
  ];
  reasons.forEach((r, i) => {
    const y = 1.15 + i * 1.4;
    iconCircle(s, 0.7, y + 0.1, 0.75, C.gold, r.num, 18);
    s.addText(r.title, { x: 1.7, y, w: 7.5, h: 0.35, fontSize: 18, fontFace: "Calibri", bold: true, color: C.white, margin: 0 });
    s.addText(r.body, { x: 1.7, y: y + 0.42, w: 7.8, h: 0.7, fontSize: 12, fontFace: "Calibri", color: C.lGrey, margin: 0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 5.0, w: 0.04, h: 0.3, fill: { color: C.gold } });
  s.addText("机会窗口：技术和市场条件已成熟，但产品化空白 — 这就是从 0 到 1 的最佳时机", {
    x: 0.9, y: 5.0, w: 8.5, h: 0.3, fontSize: 12, fontFace: "Calibri", italic: true, color: C.gold, margin: 0,
  });
})();

// ═══════════════════════════════════════
// SLIDE 10 — MODULE 3 section
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  sectionPage(s, C.amber, "模块三  ·  成员 C 汇报", "市场竞品分析与产品优势对比");
})();

// ═══════════════════════════════════════
// SLIDE 11 — MARKET LANDSCAPE (quadrants)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.amber } });
  s.addText("市场四象限全景", { x: 0.5, y: 0.1, w: 9, h: 0.4, fontSize: 20, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });

  const quadrants = [
    { text: "专业题库平台", sub: "猿题库 · 粉笔 · 准题库", x: 0.5, y: 1.15, w: 4.35, h: 1.7, color: C.red, tag: "内容封闭 · 品牌成熟 · 功能全" },
    { text: "LMS 学习管理系统", sub: "Moodle · 云课堂 · 腾讯课堂", x: 5.15, y: 1.15, w: 4.35, h: 1.7, color: C.amber, tag: "功能强大 · 部署复杂 · 成本高" },
    { text: "通用问卷工具", sub: "腾讯问卷 · 金数据 · 问卷星", x: 0.5, y: 3.1, w: 4.35, h: 1.7, color: C.grey, tag: "通用性强 · 无题库逻辑" },
    { text: "★ DocQuiz", sub: "文档 → 题库  全自动", x: 5.15, y: 3.1, w: 4.35, h: 1.7, color: C.green, tag: "私有题库 · 零门槛 · AI解析 · 链接分享" },
  ];
  quadrants.forEach((q) => {
    cardShape(s, q.x, q.y, q.w, q.h, { fill: q.color === C.green ? C.lightGreen : C.cream });
    s.addShape(pres.shapes.RECTANGLE, { x: q.x, y: q.y, w: q.w, h: 0.05, fill: { color: q.color } });
    s.addText(q.text, { x: q.x + 0.1, y: q.y + 0.2, w: q.w - 0.2, h: 0.45, fontSize: q.color === C.green ? 17 : 15, fontFace: "Calibri", bold: true, color: q.color === C.green ? C.dkNavy : C.dkNavy, align: "center", margin: 0 });
    s.addText(q.sub, { x: q.x + 0.1, y: q.y + 0.7, w: q.w - 0.2, h: 0.35, fontSize: 12, fontFace: "Calibri", color: C.grey, align: "center", margin: 0 });
    s.addText(q.tag, { x: q.x + 0.1, y: q.y + 1.2, w: q.w - 0.2, h: 0.35, fontSize: 10, fontFace: "Calibri", italic: true, color: q.color, align: "center", margin: 0 });
  });

  s.addText("高  ←  内容开放度  →  低", { x: 0.5, y: 0.7, w: 9, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.grey, align: "center", margin: 0 });
})();

// ═══════════════════════════════════════
// SLIDE 12 — COMPETITIVE COMPARISON TABLE
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.amber } });
  s.addText("竞品逐项对比  —  11 项指标", { x: 0.5, y: 0.08, w: 9, h: 0.4, fontSize: 20, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });

  const h = (txt, bg) => ({ text: txt, options: { fill: { color: bg || C.dkNavy }, color: C.white, bold: true, fontSize: 9, fontFace: "Calibri", align: "center", valign: "middle" } });
  const c = (txt, opts) => ({ text: txt, options: { fontSize: 9, fontFace: "Calibri", color: C.dkNavy, valign: "middle", align: "center", ...opts } });

  const rows = [
    [h("对比维度"), h("猿题库/粉笔"), h("腾讯问卷"), h("Moodle"), h("DocQuiz（我们）", C.gold)],
    [c("上传私有题库", { bold: true }), c("NO", { color: C.red }), c("仅表单"), c("YES"), c("YES", { bold: true, color: C.green })],
    [c("Word自动解析", { bold: true }), c("NO", { color: C.red }), c("NO", { color: C.red }), c("NO", { color: C.red }), c("核心创新", { bold: true, color: C.green })],
    [c("随机出题", { bold: true }), c("YES"), c("NO"), c("YES"), c("YES", { bold: true, color: C.green })],
    [c("错题本", { bold: true }), c("YES"), c("NO"), c("YES"), c("规划中", { bold: true, color: C.amber })],
    [c("答题统计", { bold: true }), c("YES"), c("基础"), c("YES"), c("YES", { bold: true, color: C.green })],
    [c("零技术门槛"), c("部分"), c("YES"), c("需搭建"), c("YES", { bold: true, color: C.green })],
    [c("免费使用"), c("部分"), c("基础版"), c("YES"), c("YES", { bold: true, color: C.green })],
    [c("分享便捷"), c("同平台"), c("链接"), c("复杂"), c("链接即分享", { bold: true, color: C.green })],
    [c("内容归属"), c("平台", { color: C.red }), c("用户"), c("用户"), c("用户", { bold: true, color: C.green })],
    [c("目标用户"), c("个人备考"), c("通用"), c("大型机构"), c("培训/教师/社群", { bold: true, color: C.mdTeal })],
  ];
  s.addTable(rows, {
    x: 0.2, y: 0.6, w: 9.6, colW: [1.9, 1.8, 1.8, 1.8, 2.3],
    border: { pt: 0.3, color: C.lGrey },
    rowH: [0.32, 0.36, 0.38, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.38],
    autoPage: false,
  });
  s.addText("竞品中唯一覆盖\"文档 → 题库\"自动化全链路的方案。核心竞争力不在于功能最多，而在于解决了别人没解决的问题。", {
    x: 0.2, y: 5.1, w: 9.6, h: 0.3, fontSize: 10, fontFace: "Calibri", color: C.grey, margin: 0, align: "center",
  });
})();

// ═══════════════════════════════════════
// SLIDE 13 — SWOT + ADVANTAGES (2-col layout)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.amber } });
  s.addText("SWOT 分析  &  四大差异化优势", { x: 0.5, y: 0.08, w: 9.2, h: 0.38, fontSize: 18, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });

  // SWOT 2x2 (left)
  const swot = [
    { label: "S 优势", items: "独特的文档解析技术\n零门槛使用体验\n内容 100% 归属用户\n开源 + 低成本运营", x: 0.3, y: 0.6, color: C.green },
    { label: "W 劣势", items: "品牌认知度为零\n题库依赖用户上传\nMVP 无用户系统\n盈利模式尚未验证", x: 4.8, y: 0.6, color: C.red },
    { label: "O 机会", items: "企业培训数字化加速\nAI 持续降低开发成本\n非技术用户需求被忽视\n开源社区放大影响力", x: 0.3, y: 2.75, color: C.blue },
    { label: "T 威胁", items: "大平台可能跟进\n市场竞争持续加剧\n用户付费习惯待培养\n纯技术壁垒不够高", x: 4.8, y: 2.75, color: C.amber },
  ];
  swot.forEach((q) => {
    cardShape(s, q.x, q.y, 4.2, 1.95, { fill: C.cream });
    s.addShape(pres.shapes.RECTANGLE, { x: q.x, y: q.y, w: 4.2, h: 0.04, fill: { color: q.color } });
    s.addText(q.label, { x: q.x + 0.12, y: q.y + 0.1, w: 1.5, h: 0.28, fontSize: 12, fontFace: "Calibri", bold: true, color: q.color, margin: 0 });
    s.addText(q.items, { x: q.x + 0.12, y: q.y + 0.45, w: 3.9, h: 1.4, fontSize: 10, fontFace: "Calibri", color: C.dkNavy, margin: 0 });
  });

  // 4 Advantages (below)
  const advantages = [
    { num: "1", title: "唯一方案", desc: "全市场唯一的文档→题库自动化", color: C.green },
    { num: "2", title: "内容主权", desc: "100% 私有题库 · 用户完全可控", color: C.blue },
    { num: "3", title: "极致门槛", desc: "10 分钟从 0 到在线 · 无需编码", color: C.mdTeal },
    { num: "4", title: "蓝海人群", desc: "面向\"出题者\" · 而非刷题者", color: C.amber },
  ];
  advantages.forEach((a, i) => {
    const x = 0.4 + i * 2.4;
    iconCircle(s, x + 0.65, 4.85, 0.6, a.color, a.num, 16);
    s.addText(a.title, { x: x + 1.32, y: 4.88, w: 1.2, h: 0.28, fontSize: 12, fontFace: "Calibri", bold: true, color: C.dkNavy, margin: 0 });
    s.addText(a.desc, { x: x + 1.32, y: 5.18, w: 1.2, h: 0.3, fontSize: 9, fontFace: "Calibri", color: C.grey, margin: 0 });
  });
})();

// ═══════════════════════════════════════
// SLIDE 14 — MODULE 4 section
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  sectionPage(s, C.purple, "模块四  ·  成员 D 汇报", "商业模式的可视化构建");
})();

// ═══════════════════════════════════════
// SLIDE 15 — BUSINESS MODEL CANVAS (9-cell)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.purple } });
  s.addText("商业模式画布  ·  九宫格全景", { x: 0.5, y: 0.08, w: 9, h: 0.38, fontSize: 18, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });

  const canvas = [
    { label: "客户细分", content: "B端：企业培训部 · 培训机构\nC端：备考社群运营者\n长尾：高校教师 · 辅导员", color: C.blue },
    { label: "价值主张", content: "\"上传文档，10 分钟拥有\n你自己的在线题库\"\n极简 · 私有 · 零门槛 · AI驱动", color: C.purple },
    { label: "渠道通路", content: "开源社区 (GitHub)\n技术社区 (掘金/知乎)\n微信社群裂变", color: C.blue },
    { label: "客户关系", content: "C端：自助服务 + 社区\nB端：客户成功经理\n专属支持 + SLA", color: C.purple },
    { label: "收入来源", content: "个人免费  ·  ¥0\n团队版  ·  ¥99/月\n企业版  ·  ¥599/月", color: C.gold },
    { label: "核心资源", content: "AI 解析引擎（技术壁垒）\n题库格式知识库（行业壁垒）\n开发者社区（生态壁垒）", color: C.blue },
    { label: "关键活动", content: "解析引擎迭代 · 兼容更多格式\n内容运营 · 案例库建设\nB端渠道拓展 · 合作伙伴开发", color: C.purple },
    { label: "重要合作", content: "培训机构（内容合作 + 渠道）\n高校（批量采购 + 联合推广）\n技术社区（开源生态共建）", color: C.blue },
    { label: "成本结构", content: "轻量服务器（初期免费）\n5人团队开发人力\n数字营销（社群 + SEO）", color: C.grey },
  ];

  canvas.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.3 + col * 3.2;
    const y = 0.6 + row * 1.65;
    cardShape(s, x, y, 2.95, 1.45, { fill: C.cream });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.95, h: 0.04, fill: { color: item.color } });
    s.addText(item.label, { x: x + 0.1, y: y + 0.08, w: 2.75, h: 0.26, fontSize: 10, fontFace: "Calibri", bold: true, color: item.color, margin: 0 });
    s.addText(item.content, { x: x + 0.1, y: y + 0.38, w: 2.75, h: 0.95, fontSize: 10, fontFace: "Calibri", color: C.dkNavy, margin: 0, valign: "top" });
  });
})();

// ═══════════════════════════════════════
// SLIDE 16 — PRICING + REVENUE PATH
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.purple } });
  s.addText("Freemium 定价  &  盈利路径预测", { x: 0.5, y: 0.08, w: 9, h: 0.38, fontSize: 18, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });

  // Pricing tiers
  const tiers = [
    { name: "免费版", price: "¥0", color: C.grey, features: "200 题  ·  3 个题库\n基础答题统计\n开源社区支持", tag: "" },
    { name: "团队版", price: "¥99/月", color: C.purple, features: "不限题目  ·  10 个题库\n详细统计  ·  团队协作\n50人团队 · 优先支持", tag: "推荐" },
    { name: "企业版", price: "¥599/月", color: C.gold, features: "全部功能  ·  SSO\n私有部署  ·  API\n数据导出  ·  专属经理", tag: "" },
  ];

  tiers.forEach((t, i) => {
    const x = 0.4 + i * 3.15;
    const isHL = t.tag;
    cardShape(s, x, 0.7, 2.9, 2.5, { fill: isHL ? C.cream : C.white, shadow: isHL ? true : true });
    if (isHL) {
      s.addShape(pres.shapes.RECTANGLE, { x, y: 0.7, w: 2.9, h: 0.06, fill: { color: C.gold } });
    }

    s.addText(t.name, { x, y: 0.8, w: 2.9, h: 0.3, fontSize: 13, fontFace: "Calibri", bold: true, color: C.dkNavy, align: "center", margin: 0 });
    s.addText(t.price, { x, y: 1.15, w: 2.9, h: 0.45, fontSize: 28, fontFace: "Georgia", bold: true, color: t.color, align: "center", margin: 0 });

    if (isHL) {
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.85, y: 1.62, w: 1.2, h: 0.25, fill: { color: C.purple }, rectRadius: 0.02 });
      s.addText(t.tag, { x: x + 0.85, y: 1.62, w: 1.2, h: 0.25, fontSize: 9, fontFace: "Calibri", bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    }

    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.5, y: 2.0, w: 1.9, h: 0.01, fill: { color: C.lGrey } });
    s.addText(t.features, { x: x + 0.1, y: 2.1, w: 2.7, h: 1.0, fontSize: 11, fontFace: "Calibri", color: C.dkNavy, align: "center", margin: 0 });
  });

  // Revenue chart
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 3.5, w: 9.2, h: 0.02, fill: { color: C.lGrey } });
  s.addText("12 个月 ARR 增长路径", { x: 0.5, y: 3.58, w: 3, h: 0.28, fontSize: 11, fontFace: "Calibri", bold: true, color: C.purple, margin: 0 });

  s.addChart(pres.charts.BAR, [{
    name: "年化收入 (万元)",
    labels: ["验证期\n月1-3", "产品期\n月4-6", "商业期\n月7-9", "扩张期\n10-12"],
    values: [0, 3, 10, 50],
  }], {
    x: 0.3, y: 3.9, w: 4.8, h: 1.55,
    barDir: "col",
    chartColors: [C.purple],
    chartArea: { fill: { color: C.white } },
    catAxisLabelColor: C.grey, catAxisLabelFontSize: 8,
    valAxisLabelColor: C.grey,
    valGridLine: { color: C.lGrey, size: 0.3 },
    catGridLine: { style: "none" },
    showValue: true, dataLabelPosition: "outEnd",
    dataLabelColor: C.dkNavy, dataLabelFontSize: 11,
    showLegend: false, showTitle: false, valAxisHidden: true,
  });

  // Milestones
  const stones = [
    "月 0-3：GitHub 200+ Star  ·  100 活跃用户",
    "月 4-6：SaaS 上线  ·  50 付费用户",
    "月 7-9：签约 3-5 家企业  ·  10 万 ARR",
    "月 10-12：合作 5+ 机构  ·  50 万 ARR",
  ];
  stones.forEach((st, i) => {
    s.addText((i + 1) + ".  " + st, { x: 5.4, y: 3.95 + i * 0.38, w: 4.2, h: 0.32, fontSize: 10, fontFace: "Calibri", color: C.dkNavy, margin: 0 });
  });
})();

// ═══════════════════════════════════════
// SLIDE 17 — MODULE 5 section
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  sectionPage(s, C.gold, "模块五  ·  刘舟（NB）汇报", "行动路线图与可行性分析");
})();

// ═══════════════════════════════════════
// SLIDE 18 — ROADMAP (4 phases, horizontal timeline)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.gold } });
  s.addText("四阶段实施路线图  ·  12 个月从 0 到 50 万 ARR", { x: 0.5, y: 0.08, w: 9, h: 0.38, fontSize: 18, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });

  const phases = [
    { phase: "验证期", time: "现在  ~  第 2 月", color: C.green, items: ["收集 100 个真实用户反馈", "解析准确率 ≥ 90%", "GitHub 200+ Star", "技术文章推广"], team: "5人" },
    { phase: "产品期", time: "第 3 ~ 5 月", color: C.mdTeal, items: ["用户系统 · 管理后台", "错题本 · 收藏功能", "支付集成 · 团队版上线", "SaaS 化部署"], team: "5人" },
    { phase: "商业期", time: "第 6 ~ 9 月", color: C.gold, items: ["签约 3-5 家培训/企业", "2-3 所高校试点合作", "API 接口 · 私有部署", "扩展至 8 人团队"], team: "5+3人" },
    { phase: "扩张期", time: "第 10 ~ 12 月", color: C.purple, items: ["机构 5+ · ARR ¥50万", "英文版国际化", "微信小程序版", "AI 智能题库推荐"], team: "8-10人" },
  ];

  // Timeline line
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 0.75, w: 8.4, h: 0.02, fill: { color: C.mdTeal } });

  phases.forEach((p, i) => {
    const x = 0.3 + i * 2.4;
    // Timeline dot
    iconCircle(s, x + 0.85, 0.62, 0.28, p.color, String(i + 1), 11);

    cardShape(s, x, 1.1, 2.2, 4.3, { fill: C.cream });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.1, w: 2.2, h: 0.05, fill: { color: p.color } });
    s.addText(p.phase, { x, y: 1.22, w: 2.2, h: 0.35, fontSize: 15, fontFace: "Calibri", bold: true, color: p.color, align: "center", margin: 0 });
    s.addText(p.time, { x, y: 1.58, w: 2.2, h: 0.22, fontSize: 9, fontFace: "Calibri", color: C.grey, align: "center", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.4, y: 1.9, w: 1.4, h: 0.01, fill: { color: C.lGrey } });

    p.items.forEach((item, j) => {
      s.addText("  " + item, { x: x + 0.08, y: 2.05 + j * 0.42, w: 2.04, h: 0.38, fontSize: 9.5, fontFace: "Calibri", color: C.dkNavy, margin: 0 });
    });

    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.3, y: 4.9, w: 1.6, h: 0.25, fill: { color: p.color, transparency: 85 }, rectRadius: 0.02 });
    s.addText("团队：" + p.team, { x: x + 0.3, y: 4.9, w: 1.6, h: 0.25, fontSize: 9, fontFace: "Calibri", bold: true, color: p.color, align: "center", valign: "middle", margin: 0 });
  });
})();

// ═══════════════════════════════════════
// SLIDE 19 — RISK + FEASIBILITY (2-col)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.gold } });
  s.addText("风险评估  &  可行性结论", { x: 0.5, y: 0.08, w: 9, h: 0.38, fontSize: 18, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });

  // Left: Risk horizontal bar chart
  s.addText("风险等级评估（1-5）", { x: 0.5, y: 0.55, w: 3, h: 0.25, fontSize: 10, fontFace: "Calibri", bold: true, color: C.grey, margin: 0 });

  s.addChart(pres.charts.BAR, [{
    name: "风险等级",
    labels: ["资金", "运营", "市场", "技术", "竞争"],
    values: [2, 2, 3, 3, 4],
  }], {
    x: 0.2, y: 0.8, w: 4.5, h: 1.8,
    barDir: "bar",
    chartColors: [C.gold],
    chartArea: { fill: { color: C.white } },
    catAxisLabelColor: C.dkNavy, catAxisLabelFontSize: 10,
    valAxisLabelColor: C.grey,
    valGridLine: { color: C.lGrey, size: 0.3 },
    catGridLine: { style: "none" },
    showValue: true, dataLabelPosition: "outEnd",
    dataLabelColor: C.dkNavy, dataLabelFontSize: 10,
    showLegend: false, showTitle: false, valAxisMaxVal: 5,
  });

  // Right: Feasibility ratings
  s.addText("综合可行性评估", { x: 5.3, y: 0.55, w: 3, h: 0.25, fontSize: 10, fontFace: "Calibri", bold: true, color: C.grey, margin: 0 });

  const dims = [
    { dim: "技术可行性", score: "高  ", note: "MVP 已验证核心技术", color: C.green },
    { dim: "市场可行性", score: "中高", note: "需验证付费转化率", color: C.mdTeal },
    { dim: "团队可行性", score: "高  ", note: "5人能力互补，协同高效", color: C.green },
    { dim: "经济可行性", score: "中高", note: "Freemium 风险可控，零成本启动", color: C.mdTeal },
    { dim: "时间可行性", score: "中  ", note: "12个月路径清晰可执行", color: C.amber },
  ];
  dims.forEach((d, i) => {
    const y = 0.8 + i * 0.52;
    cardShape(s, 5.2, y, 4.4, 0.44, { fill: C.cream, shadow: false });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y, w: 0.04, h: 0.44, fill: { color: d.color } });
    s.addText(d.dim, { x: 5.4, y: y + 0.05, w: 1.8, h: 0.34, fontSize: 12, fontFace: "Calibri", bold: true, color: C.dkNavy, margin: 0 });
    s.addText(d.score, { x: 7.3, y: y + 0.05, w: 0.7, h: 0.34, fontSize: 14, fontFace: "Georgia", bold: true, color: d.color, align: "center", margin: 0 });
    s.addText(d.note, { x: 8.1, y: y + 0.06, w: 1.4, h: 0.32, fontSize: 9, fontFace: "Calibri", color: C.grey, margin: 0 });
  });

  // Bottom: Risk response table
  const rh = (txt) => ({ text: txt, options: { fill: { color: C.dkNavy }, color: C.white, bold: true, fontSize: 9, fontFace: "Calibri", align: "center", valign: "middle" } });
  const rc = (txt, o) => ({ text: txt, options: { fontSize: 9, fontFace: "Calibri", color: C.dkNavy, valign: "middle", ...o } });

  const risks = [
    [rh("风险类型"), rh("概率"), rh("影响"), rh("应对策略")],
    [rc("竞争：大平台跟进", { bold: true, color: C.red }), rc("中", { align: "center" }), rc("高", { align: "center" }), rc("速度优先 + 开源生态 + 聚焦垂直场景", { color: C.mdTeal })],
    [rc("市场：付费意愿低"), rc("中", { align: "center" }), rc("高", { align: "center" }), rc("Freemium 免费版足够好，靠口碑裂变", { color: C.mdTeal })],
    [rc("技术：解析准确率"), rc("中", { align: "center" }), rc("中", { align: "center" }), rc("持续迭代 + 人工审核兜底 + 知识库", { color: C.mdTeal })],
    [rc("运营：团队推进慢"), rc("中", { align: "center" }), rc("低", { align: "center" }), rc("最小化核心功能，快速迭代，明确分工", { color: C.mdTeal })],
    [rc("资金：初期零收入"), rc("低", { align: "center" }), rc("低", { align: "center" }), rc("开源 + 零服务器成本启动，阶段三盈利", { color: C.mdTeal })],
  ];
  s.addTable(risks, {
    x: 0.2, y: 3.6, w: 9.6, colW: [2.1, 0.7, 0.7, 6.1],
    border: { pt: 0.3, color: C.lGrey },
    rowH: [0.3, 0.36, 0.36, 0.36, 0.36, 0.36],
    autoPage: false,
  });
})();

// ═══════════════════════════════════════
// SLIDE 19B — IMPLEMENTATION APPROACH (MVP 2-phase)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.06, h: 5.625, fill: { color: C.gold } });
  s.addText("MVP 实现路径  —  两步走策略", { x: 0.5, y: 0.08, w: 9, h: 0.38, fontSize: 18, fontFace: "Georgia", bold: true, color: C.dkNavy, margin: 0 });
  s.addText("先跑通核心流程，再叠加 AI 能力。降低风险，快速验证。", {
    x: 0.5, y: 0.48, w: 9, h: 0.22, fontSize: 10, fontFace: "Calibri", italic: true, color: C.grey, margin: 0,
  });

  // Phase 1 — Left column
  cardShape(s, 0.3, 0.85, 4.6, 4.2, { fill: C.cream });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 0.85, w: 4.6, h: 0.06, fill: { color: C.green } });
  s.addText("第一阶段  ·  当前即可交付", { x: 0.5, y: 1.0, w: 4.2, h: 0.3, fontSize: 14, fontFace: "Calibri", bold: true, color: C.green, margin: 0 });
  s.addText("纯前端方案  ·  GitHub Pages 部署  ·  零后端成本", {
    x: 0.5, y: 1.28, w: 4.2, h: 0.2, fontSize: 9, fontFace: "Calibri", color: C.grey, margin: 0,
  });

  const p1Items = [
    { title: "浏览器端解析", desc: "mammoth.js 在浏览器读取 .docx，无需上传服务器" },
    { title: "智能提取题目", desc: "JS 规则引擎识别单选/多选/判断/填空格式" },
    { title: "拖拽上传界面", desc: "支持文件拖拽 + 点击上传，实时预览解析结果" },
    { title: "本地存储题库", desc: "IndexedDB 持久化，刷新不丢失，离线可用" },
    { title: "题库即上线", desc: "保存后立即可刷题，生成分享链接" },
  ];
  p1Items.forEach((item, i) => {
    const y = 1.65 + i * 0.6;
    iconCircle(s, 0.55, y + 0.05, 0.32, C.green, String(i + 1), 11);
    s.addText(item.title, { x: 1.0, y: y, w: 3.8, h: 0.22, fontSize: 12, fontFace: "Calibri", bold: true, color: C.dkNavy, margin: 0 });
    s.addText(item.desc, { x: 1.0, y: y + 0.24, w: 3.8, h: 0.22, fontSize: 10, fontFace: "Calibri", color: C.grey, margin: 0 });
  });

  // Phase 2 — Right column
  cardShape(s, 5.1, 0.85, 4.6, 4.2, { fill: C.cream });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 0.85, w: 4.6, h: 0.06, fill: { color: C.gold } });
  s.addText("第二阶段  ·  后续迭代", { x: 5.3, y: 1.0, w: 4.2, h: 0.3, fontSize: 14, fontFace: "Calibri", bold: true, color: C.gold, margin: 0 });
  s.addText("接入 AI  +  云端服务  ·  需要后端", {
    x: 5.3, y: 1.28, w: 4.2, h: 0.2, fontSize: 9, fontFace: "Calibri", color: C.grey, margin: 0,
  });

  const p2Items = [
    { title: "AI 智能出题", desc: "无需预写 Q&A 格式，AI 从原始文稿自动生成题目" },
    { title: "云存储同步", desc: "题库云端备份，多设备同步，团队协作" },
    { title: "高级分析面板", desc: "答题数据可视化，学习进度追踪，薄弱点分析" },
    { title: "微信小程序版", desc: "原生微信小程序，分享到微信群即点即用" },
    { title: "开放 API", desc: "供第三方系统集成，企业 SSO + 私有部署" },
  ];
  p2Items.forEach((item, i) => {
    const y = 1.65 + i * 0.6;
    iconCircle(s, 5.35, y + 0.05, 0.32, C.gold, String(i + 1), 11);
    s.addText(item.title, { x: 5.8, y: y, w: 3.8, h: 0.22, fontSize: 12, fontFace: "Calibri", bold: true, color: C.dkNavy, margin: 0 });
    s.addText(item.desc, { x: 5.8, y: y + 0.24, w: 3.8, h: 0.22, fontSize: 10, fontFace: "Calibri", color: C.grey, margin: 0 });
  });

  // Bottom summary
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 5.25, w: 9.4, h: 0.25, fill: { color: C.lightTeal } });
  s.addText("MVP 关键原则：先让「已有 Q&A 格式的文档」能在线转化 → 验证用户需求 → 再叠加 AI 自动出题", {
    x: 0.5, y: 5.25, w: 9, h: 0.25, fontSize: 10, fontFace: "Calibri", italic: true, color: C.mdTeal, align: "center", margin: 0,
  });
})();

// ═══════════════════════════════════════
// SLIDE 20 — CLOSING (dark, impactful)
// ═══════════════════════════════════════
(() => {
  const s = pres.addSlide();
  s.background = { color: C.dkNavy };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 4.5, h: 5.625, fill: { color: C.mdTeal, transparency: 30 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 2.15, w: 1.6, h: 0.04, fill: { color: C.gold } });

  s.addText([
    { text: "从自己用，", options: {} },
    { text: "到让别人用，", options: { color: C.gold } },
    { text: "\n再到让所有有题库的人都能用。", options: {} },
  ], { x: 0.9, y: 0.7, w: 8.5, h: 1.3, fontSize: 24, fontFace: "Georgia", bold: true, color: C.white, margin: 0 });

  s.addText("— 这就是 DocQuiz 从 0 到 1 的创业逻辑", {
    x: 0.9, y: 2.5, w: 9, h: 0.45, fontSize: 15, fontFace: "Calibri", color: C.gold, margin: 0,
  });

  s.addText("团队成员", { x: 0.9, y: 3.3, w: 9, h: 0.3, fontSize: 11, fontFace: "Calibri", color: C.grey, margin: 0 });
  s.addText("成员 A   ·   成员 B   ·   成员 C   ·   成员 D   ·   刘舟（NB）", {
    x: 0.9, y: 3.6, w: 9, h: 0.4, fontSize: 16, fontFace: "Calibri", bold: true, color: C.white, margin: 0,
  });

  s.addText("DocQuiz", {
    x: 0.9, y: 4.35, w: 9, h: 0.45, fontSize: 24, fontFace: "Georgia", bold: true, color: C.lGrey, margin: 0,
  });
  s.addText("谢 谢 ！", {
    x: 0.9, y: 4.8, w: 9, h: 0.5, fontSize: 36, fontFace: "Georgia", bold: true, color: C.white, margin: 0,
  });
  s.addText("liuzhou1204.github.io/quiz/      ·      github.com/liuzhou1204/quiz", {
    x: 0.9, y: 5.35, w: 9, h: 0.25, fontSize: 9, fontFace: "Calibri", color: C.gold, margin: 0,
  });
})();

// ═══════════════════════════════════════
// SAVE
// ═══════════════════════════════════════
const outPath = path.join(__dirname, "DocQuiz_商业方案.pptx");
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("PPT saved: " + outPath);
}).catch(err => {
  console.error("Error: " + err.message);
});
