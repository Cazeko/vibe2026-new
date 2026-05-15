// Fitly 발표 .pptx 빌더 (2026-05-15 / 2026-05-16 색·그레인 정합)
//
// 입력: docs/plans/2026-05-15-presentation-package.md (정리본)
// 출력: fitly/발표.pptx (14 슬라이드, 16:9, 1920×1080)
//
// 디자인 토큰 (DESIGN.md v3.0.1 §4 — 색 / §4.5 종이 그레인 정합)
//   배경:    cream    #FAF6EE
//   카드:    cream-soft #FFFAF1 / cream-deep #F3EDE0
//   텍스트:  ink      #1A2027
//   보조:    text-muted #6B6256 (warm gray, DESIGN.md §4.1)
//   액센트:  evergreen #1F5C4A (deep — §4.3 6 사용처 한정)
//   괘선:    rule #E8E2D5 / rule-strong #C8BFA8
//   헤드라인: Noto Serif KR Bold
//   본문:    Noto Sans KR
//
// 종이 그레인 (§4.5) — SlideMaster 단위로 한 번 정의 → 14 슬라이드 공유.
//   PPT 는 CSS radial-gradient 지원 X 라 200 개 의 미세 도형(0.02"×0.02",
//   ink transparency 92~95%) 을 무작위 분포 → 종이 결 근사. 4px grid 원본
//   대비 거칠지만 "가까이 보면 결, 멀리 보면 단색" 정합 톤.
//
// 16:9 레이아웃 = 10 × 5.625 inches
// 콘텐츠 안전 영역: 좌우 0.4", 상하 0.3" 여백 → 9.2" × 5.025"

const pptxgen = require("pptxgenjs");

// ─────────── 디자인 토큰 (DESIGN.md §4 정합) ───────────
const C = {
  cream: "FAF6EE",          // --color-bg (warm cream paper)
  creamSoft: "FFFAF1",      // --color-surface
  creamDeep: "F3EDE0",      // --color-surface-deep
  ink: "1A2027",            // --color-text (deep ink)
  inkSoft: "434B55",        // 본문 부드럽게 (자체 톤)
  inkMuted: "6B6256",       // --color-text-muted (warm gray)
  evergreen: "1F5C4A",      // --color-accent (deep evergreen)
  evergreenStrong: "173F33",// --color-accent-strong
  evergreenSoft: "5C8077",  // 자체 (보조 evergreen)
  rule: "E8E2D5",           // --color-rule
  ruleStrong: "C8BFA8",     // --color-rule-strong
};
const F = {
  serif: "Noto Serif KR",
  sans: "Noto Sans KR",
};

// 슬라이드 공통 영역
const W = 10;          // 슬라이드 폭
const H = 5.625;       // 슬라이드 높이
const MX = 0.5;        // 좌우 여백
const MY = 0.4;        // 상하 여백
const CW = W - MX * 2; // 콘텐츠 폭

// ─────────── 헬퍼 ───────────
function addPartLabel(slide, label) {
  slide.addText(label, {
    x: MX, y: MY, w: CW, h: 0.3,
    fontFace: F.sans, fontSize: 11, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
}
function addTitle(slide, text, opts = {}) {
  slide.addText(text, {
    x: MX, y: MY + 0.3, w: CW, h: 0.7,
    fontFace: F.serif, fontSize: opts.size || 32, bold: true,
    color: C.ink, valign: "top", margin: 0,
    paraSpaceAfter: 0,
  });
}
function addRule(slide, y, opts = {}) {
  // 가로 괘선 1줄 (메모러블 앵커 — ink/30%)
  slide.addShape("line", {
    x: MX, y: y, w: CW, h: 0,
    line: { color: C.ink, width: 0.5, transparency: 70 },
  });
}
function addFooter(slide, pageNo) {
  slide.addText("Fitly", {
    x: MX, y: H - 0.4, w: 1, h: 0.25,
    fontFace: F.serif, fontSize: 10, italic: true,
    color: C.inkMuted, margin: 0,
  });
  slide.addText(String(pageNo), {
    x: W - MX - 1, y: H - 0.4, w: 1, h: 0.25,
    fontFace: F.sans, fontSize: 10,
    color: C.inkMuted, align: "right", margin: 0,
  });
}

// ─────────── 빌더 ───────────
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Fitly — 합격은 시간이 아니라 적합도다";
pres.author = "Fitly Team";
pres.subject = "한국 초등교사 임용 1차 학습 플래너 PWA";

// ─────────── SlideMaster — 종이 그레인 배경 (DESIGN.md §4.5) ───────────
// 마스터에 한 번 정의 → 14 슬라이드 자동 상속. PPTX 파일 크기 절약 (master 객체는
// 한 번만 직렬화). 점 위치는 시드 고정 무작위 — 빌드 재현성 보장.
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
const grainRand = seededRandom(20260516);
const GRAIN_DOTS = 220;
const grainObjects = [];
for (let i = 0; i < GRAIN_DOTS; i++) {
  const x = +(grainRand() * (W - 0.05)).toFixed(3);
  const y = +(grainRand() * (H - 0.05)).toFixed(3);
  const size = 0.012 + grainRand() * 0.012; // 0.012~0.024"
  const transp = 88 + Math.floor(grainRand() * 8); // 88~95
  grainObjects.push({
    rect: {
      x, y, w: +size.toFixed(3), h: +size.toFixed(3),
      fill: { color: C.ink, transparency: transp },
      line: { type: "none" },
    },
  });
}
pres.defineSlideMaster({
  title: "FITLY_PAPER",
  background: { color: C.cream },
  objects: grainObjects,
});

let pageNo = 0;

// ─────────── Slide 0-1 표지 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  // 좌측 상단 작은 라벨
  s.addText("PRESENTATION · 2026.05", {
    x: MX, y: MY, w: CW, h: 0.3,
    fontFace: F.sans, fontSize: 10, bold: true,
    color: C.evergreen, charSpacing: 8, margin: 0,
  });

  // 메인 헤드라인 (중앙)
  s.addText("Fitly", {
    x: MX, y: 1.4, w: CW, h: 1.0,
    fontFace: F.serif, fontSize: 84, bold: true,
    color: C.ink, align: "center", valign: "middle", margin: 0,
  });

  // 펀치라인
  s.addText("합격은 시간이 아니라 적합도다.", {
    x: MX, y: 2.5, w: CW, h: 0.6,
    fontFace: F.serif, fontSize: 22,
    color: C.evergreen, align: "center", valign: "middle", margin: 0,
  });

  // 가로 괘선 (메모러블 앵커)
  addRule(s, 3.3);

  // 부제 + 팀
  s.addText([
    { text: "한국 초등교사 임용 1차 학습 플래너 PWA", options: { fontFace: F.sans, fontSize: 14, color: C.inkSoft, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "팀명: [팀명]   ·   2026.05", options: { fontFace: F.sans, fontSize: 12, color: C.inkMuted } },
  ], {
    x: MX, y: 3.5, w: CW, h: 1.5, align: "center", valign: "top", margin: 0,
  });

  s.addNotes(
    "안녕하세요, [팀명] 입니다. 저희가 만든 Fitly 를 소개해 드리겠습니다."
  );
}

// ─────────── Slide 1-1 배경 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 1 · 문제");
  addTitle(s, "한국 초등교사 임용 1차 시험");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 3 KPI
  const kpiY = 1.5;
  const kpiH = 1.3;
  const kpiW = (CW - 0.6) / 3; // 0.3 gap × 2
  const kpis = [
    { v: "연 4만+", k: "응시자" },
    { v: "1년 1회", k: "시험 횟수" },
    { v: "24년치", k: "공개 기출" },
  ];
  kpis.forEach((kpi, i) => {
    const x = MX + i * (kpiW + 0.3);
    s.addShape("rect", {
      x, y: kpiY, w: kpiW, h: kpiH,
      fill: { color: C.cream },
      line: { color: C.ink, width: 0.5, transparency: 80 },
    });
    s.addText(kpi.v, {
      x, y: kpiY + 0.2, w: kpiW, h: 0.65,
      fontFace: F.serif, fontSize: 36, bold: true,
      color: C.evergreen, align: "center", valign: "middle", margin: 0,
    });
    s.addText(kpi.k, {
      x, y: kpiY + 0.85, w: kpiW, h: 0.3,
      fontFace: F.sans, fontSize: 12,
      color: C.inkMuted, align: "center", valign: "middle", charSpacing: 4, margin: 0,
    });
  });

  // 시장 + 문제 진술
  s.addText([
    { text: "기존 시장", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4, breakLine: true } },
    { text: " ", options: { fontSize: 4, breakLine: true } },
    { text: "박문각·해커스 인강 패스 — ", options: { fontFace: F.sans, fontSize: 14, color: C.inkSoft } },
    { text: "80~150만원/시즌", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.ink, breakLine: true } },
    { text: "종로학원 모의고사 — ", options: { fontFace: F.sans, fontSize: 14, color: C.inkSoft } },
    { text: "90,000원/3회", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.ink, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "문제: ", options: { fontFace: F.sans, fontSize: 16, bold: true, color: C.evergreen } },
    { text: "24년치 데이터는 공개되어 있는데, ", options: { fontFace: F.sans, fontSize: 16, color: C.ink } },
    { text: "내 약점이 어디인지", options: { fontFace: F.sans, fontSize: 16, italic: true, bold: true, color: C.ink } },
    { text: " 알려주는 도구가 없습니다.", options: { fontFace: F.sans, fontSize: 16, color: C.ink } },
  ], {
    x: MX, y: 3.1, w: CW, h: 2.0, valign: "top", margin: 0, paraSpaceAfter: 4,
  });

  s.addNotes(
    "한국 초등교사 임용 1차는 연 4만 명이 응시하는 1년 1회 시험입니다. " +
    "기출은 24년치가 모두 공개돼 있고, 시중에는 박문각·해커스 같은 80~150만원짜리 패스 인강이 있습니다. " +
    "그런데 진짜 문제는, 24년치 데이터가 있어도 내 약점이 어디인지 알려주는 도구가 없다는 것 입니다."
  );
}

// ─────────── Slide 1-2 페르소나 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 1 · 문제");
  addTitle(s, "페르소나 — 김지민 (가명, 교대 4학년)");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 페르소나 메타 박스 (좌측)
  const metaW = 4.2;
  const metaH = 1.6;
  s.addShape("rect", {
    x: MX, y: 1.4, w: metaW, h: metaH,
    fill: { color: C.cream },
    line: { color: C.ink, width: 0.5, transparency: 80 },
  });
  s.addText([
    { text: "상태", options: { fontFace: F.sans, fontSize: 10, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "  2026년 11월 임용 1차 응시", options: { fontFace: F.sans, fontSize: 13, color: C.ink, breakLine: true } },
    { text: "지출", options: { fontFace: F.sans, fontSize: 10, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "  박문각 인강 12만/월 + 종로 모의 9만", options: { fontFace: F.sans, fontSize: 13, color: C.ink, breakLine: true } },
    { text: "일과", options: { fontFace: F.sans, fontSize: 10, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "  학교 → 학원 → 자취방 (왕복 1.5시간)", options: { fontFace: F.sans, fontSize: 13, color: C.ink } },
  ], {
    x: MX + 0.3, y: 1.55, w: metaW - 0.6, h: metaH - 0.3,
    valign: "top", margin: 0, paraSpaceAfter: 6,
  });

  // 페인 3개 (우측)
  const painX = MX + metaW + 0.4;
  const painW = CW - metaW - 0.4;
  const pains = [
    { n: "①", t: "약점 진단 부재", q: "“인강을 매일 듣는데, 내가 뭘 모르는지 모릅니다.”" },
    { n: "②", t: "자가 채점 모호", q: "“서술형 답안을 써도, 채점 기준이 막연합니다.”" },
    { n: "③", t: "이동 시간 비효율", q: "“통학 1.5시간이 그냥 흘러갑니다.”" },
  ];
  pains.forEach((p, i) => {
    const py = 1.4 + i * 0.95;
    s.addText(p.n, {
      x: painX, y: py, w: 0.5, h: 0.4,
      fontFace: F.serif, fontSize: 22, bold: true,
      color: C.evergreen, valign: "top", margin: 0,
    });
    s.addText([
      { text: p.t, options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.ink, breakLine: true } },
      { text: p.q, options: { fontFace: F.serif, fontSize: 12, italic: true, color: C.inkSoft } },
    ], {
      x: painX + 0.5, y: py - 0.05, w: painW - 0.5, h: 0.85,
      valign: "top", margin: 0, paraSpaceAfter: 2,
    });
  });

  s.addText("이 세 가지가 Fitly 가 풀려는 문제입니다.", {
    x: MX, y: 4.7, w: CW, h: 0.35,
    fontFace: F.sans, fontSize: 13, italic: true, bold: true,
    color: C.evergreen, align: "center", margin: 0,
  });

  s.addNotes(
    "여기 김지민이라는 학생이 있다고 가정해 봅시다. 교대 4학년이고, 올해 11월에 임용 1차를 봅니다. " +
    "박문각 인강에 한 달 12만원, 종로학원 모의고사에 9만원을 씁니다. " +
    "그런데도 김지민은 세 가지 문제를 매일 겪습니다. " +
    "첫째, 인강을 매일 듣는데도 내가 뭘 모르는지 모릅니다. " +
    "둘째, 서술형 답안을 써도 채점 기준이 막연합니다. " +
    "셋째, 통학 1.5시간이 그냥 흘러갑니다. " +
    "이 세 가지가 Fitly 가 풀려는 문제입니다."
  );
}

// ─────────── Slide 2-1 핵심 가치 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 2 · 솔루션");
  addTitle(s, "Fitly = “Fit (맞게) 학습”");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 메인 펀치라인 박스
  s.addShape("rect", {
    x: MX + 0.5, y: 1.5, w: CW - 1.0, h: 1.4,
    fill: { color: C.cream },
    line: { color: C.evergreen, width: 1.5 },
  });
  s.addText([
    { text: "내 시험일·내 약점·내 망각 곡선에", options: { fontFace: F.serif, fontSize: 22, color: C.ink, breakLine: true } },
    { text: "“맞게(Fit)” 학습합니다.", options: { fontFace: F.serif, fontSize: 26, bold: true, color: C.evergreen } },
  ], {
    x: MX + 0.5, y: 1.5, w: CW - 1.0, h: 1.4, align: "center", valign: "middle", margin: 0, paraSpaceAfter: 8,
  });

  // 세 마법 지점
  s.addText("세 개의 마법 지점", {
    x: MX, y: 3.2, w: CW, h: 0.3,
    fontFace: F.sans, fontSize: 11, bold: true,
    color: C.inkMuted, align: "center", charSpacing: 6, margin: 0,
  });

  const magics = [
    { n: "①", t: "24년치 기출 즉시 분석", v: "약점 시각화" },
    { n: "②", t: "AI 모범답안 + 5탭 분석", v: "자가 채점 명확" },
    { n: "③", t: "NotebookLM 스타일 팟캐스트", v: "이동 시간 학습" },
  ];
  const magicY = 3.65;
  const magicH = 1.4;
  const magicW = (CW - 0.6) / 3;
  magics.forEach((m, i) => {
    const x = MX + i * (magicW + 0.3);
    s.addShape("rect", {
      x, y: magicY, w: magicW, h: magicH,
      fill: { color: C.cream },
      line: { color: C.ink, width: 0.5, transparency: 80 },
    });
    s.addText(m.n, {
      x, y: magicY + 0.15, w: magicW, h: 0.4,
      fontFace: F.serif, fontSize: 22, bold: true,
      color: C.evergreen, align: "center", margin: 0,
    });
    s.addText([
      { text: m.t, options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
      { text: " ", options: { fontSize: 4, breakLine: true } },
      { text: m.v, options: { fontFace: F.sans, fontSize: 11, italic: true, color: C.evergreenSoft } },
    ], {
      x: x + 0.1, y: magicY + 0.55, w: magicW - 0.2, h: magicH - 0.6,
      align: "center", valign: "top", margin: 0, paraSpaceAfter: 2,
    });
  });

  s.addNotes(
    "Fitly 의 핵심 가치는 단 한 줄입니다 — 내 시험일, 내 약점, 내 망각 곡선에 ‘맞게(Fit)’ 학습한다. " +
    "그리고 이 가치를 세 개의 마법 지점으로 풀어냅니다. " +
    "첫째, 24년치 기출 즉시 분석. 둘째, AI 모범답안 + 5탭 분석. 셋째, 자동 생성 팟캐스트."
  );
}

// ─────────── Slide 2-2 페인-가치-기능 매핑 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 2 · 솔루션");
  addTitle(s, "페인 → 가치 → 기능 매핑");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 매핑 테이블 (3행 × 3열 — 페인 / 가치 / 기능)
  const tblY = 1.45;
  const tblH = 2.5;
  const colWs = [3.0, 2.6, 3.6]; // sum 9.2 = CW
  const headers = ["페인", "핵심 가치", "Fitly 기능"];
  const rows = [
    ["① 약점 진단 부재", "기출 즉시 분석", "기출분석 페이지\n(히트맵·토픽맵·로드맵)"],
    ["② 자가 채점 모호", "AI 채점 + 분석", "풀이 트랙 + 5탭\n(총평·키워드·diff·모범답안·이력)"],
    ["③ 이동 시간 비효율", "자동 팟캐스트", "팟캐스트 페이지\n(Gemini multi-speaker TTS)"],
  ];

  // 헤더
  let cx = MX;
  headers.forEach((h, i) => {
    s.addText(h, {
      x: cx, y: tblY, w: colWs[i], h: 0.35,
      fontFace: F.sans, fontSize: 11, bold: true,
      color: C.inkMuted, charSpacing: 6, valign: "middle", margin: 0,
    });
    cx += colWs[i];
  });
  // 헤더 아래 괘선
  addRule(s, tblY + 0.4);

  // 데이터 행
  rows.forEach((row, ri) => {
    const ry = tblY + 0.5 + ri * 0.65;
    let rx = MX;
    row.forEach((cell, ci) => {
      const isPain = ci === 0;
      const isFunc = ci === 2;
      s.addText(cell, {
        x: rx, y: ry, w: colWs[ci], h: 0.6,
        fontFace: F.sans,
        fontSize: isPain ? 14 : isFunc ? 12 : 13,
        bold: isPain || ci === 1,
        color: isPain ? C.ink : (ci === 1 ? C.evergreen : C.inkSoft),
        valign: "top", margin: 0, paraSpaceAfter: 2,
      });
      rx += colWs[ci];
    });
    // 행 사이 얇은 구분선
    if (ri < rows.length - 1) {
      s.addShape("line", {
        x: MX, y: ry + 0.6, w: CW, h: 0,
        line: { color: C.ink, width: 0.25, transparency: 90 },
      });
    }
  });

  // 보조 기능
  s.addText("보조 기능", {
    x: MX, y: 4.2, w: CW, h: 0.3,
    fontFace: F.sans, fontSize: 11, bold: true,
    color: C.inkMuted, charSpacing: 6, margin: 0,
  });
  s.addText(
    "3 트랙 SRS (풀이/키워드/오답) · 학습 워크스페이스 (마크/필터/타이머/소문항) · AI 학습 도우미 챗봇 · 학습 계획 + 학습 분석 + 마이 페이지",
    {
      x: MX, y: 4.55, w: CW, h: 0.5,
      fontFace: F.sans, fontSize: 12,
      color: C.inkSoft, valign: "top", margin: 0,
    }
  );

  s.addNotes(
    "이 세 가지 페인을 세 개의 기능에 1대 1로 매핑했습니다. " +
    "약점 진단 부재 → 기출분석 페이지에서 24년치 데이터로 영역별 약점 시각화. " +
    "자가 채점 모호 → 풀이 트랙 + 5탭 분석에서 AI 모범답안과 차이를 명확히. " +
    "이동 시간 비효율 → 자동 생성 팟캐스트로 통학 시간을 학습 시간으로. " +
    "보조 기능으로 3 트랙 SRS, 학습 워크스페이스 풀, AI 챗봇이 함께 들어갑니다. " +
    "이제 실제로 작동하는 모습을 보여드리겠습니다."
  );
}

// ─────────── Slide 3-1 데모 작동성 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 3 · 데모 ① 작동성");
  addTitle(s, "플랫폼 · 데이터 · AI 흐름");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 3 컬럼 (플랫폼 / 데이터 / AI)
  const colsY = 1.5;
  const colsH = 2.7;
  const colW = (CW - 0.6) / 3;
  const cols = [
    {
      h: "플랫폼",
      items: [
        "Next.js 15 (PWA)",
        "Supabase Auth + Storage",
        "Drizzle ORM",
        "Postgres — 19 테이블",
      ],
    },
    {
      h: "데이터",
      items: [
        "71 PDF (24년치)",
        "↓ unpdf 텍스트 추출",
        "↓ Gemini Vision OCR 폴백",
        "↓ LLM 태깅 (≤ 5)",
        "→ cards 시드",
      ],
    },
    {
      h: "AI 활용",
      items: [
        "Gemini Flash",
        " · 분석 (5탭)",
        " · 튜터 챗봇",
        "Gemini multi-speaker TTS",
        " · 자동 팟캐스트",
      ],
    },
  ];
  cols.forEach((col, i) => {
    const x = MX + i * (colW + 0.3);
    // 헤더
    s.addText(col.h, {
      x, y: colsY, w: colW, h: 0.35,
      fontFace: F.sans, fontSize: 12, bold: true,
      color: C.evergreen, charSpacing: 6, margin: 0,
    });
    // 헤더 아래 1px
    s.addShape("line", {
      x, y: colsY + 0.4, w: colW, h: 0,
      line: { color: C.evergreen, width: 1 },
    });
    // 항목들
    s.addText(col.items.map((item, j) => ({
      text: item,
      options: {
        fontFace: F.sans,
        fontSize: 12,
        color: C.ink,
        breakLine: j < col.items.length - 1,
      },
    })), {
      x, y: colsY + 0.55, w: colW, h: colsH - 0.6,
      valign: "top", margin: 0, paraSpaceAfter: 6,
    });
  });

  // 데모 영상 안내 박스
  s.addShape("rect", {
    x: MX, y: 4.4, w: CW, h: 0.7,
    fill: { color: C.evergreen, transparency: 92 },
    line: { color: C.evergreen, width: 0.5, transparency: 60 },
  });
  s.addText([
    { text: "▶  ", options: { fontFace: F.sans, fontSize: 16, bold: true, color: C.evergreen } },
    { text: "데모 영상 — 가입 / 대시보드 / 기출분석 / 풀이 5탭 / 팟캐스트 / 워크스페이스 (3분)", options: { fontFace: F.sans, fontSize: 14, color: C.ink } },
  ], {
    x: MX + 0.3, y: 4.4, w: CW - 0.6, h: 0.7, valign: "middle", margin: 0,
  });

  s.addNotes(
    "데모 들어가기 전 1줄 — 24년치 PDF 71개를 unpdf 로 추출, 실패 시 Gemini Vision OCR 폴백, " +
    "LLM 태깅으로 시드, Postgres 19 테이블에 적재. 학습 본업은 Gemini Flash 와 multi-speaker TTS 가 담당합니다. " +
    "[데모 영상 3분 — 가입→시험일 입력→대시보드→기출분석→풀이 트랙→AI 5탭 분석→팟캐스트→워크스페이스 풀 기능]"
  );
}

// ─────────── Slide 4-1 데모 사용성 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 4 · 데모 ② 사용성");
  addTitle(s, "디자인 시스템 — 메모러블 앵커");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 메모러블 앵커 (인용 박스)
  s.addShape("rect", {
    x: MX, y: 1.45, w: CW, h: 0.9,
    fill: { color: C.cream },
    line: { color: C.evergreen, width: 1 },
  });
  s.addText([
    { text: "“", options: { fontFace: F.serif, fontSize: 28, color: C.evergreen } },
    { text: "공책 가로 괘선 + 세리프 헤드라인 + 학습 진척도만 컬러로 빛난다.", options: { fontFace: F.serif, fontSize: 18, italic: true, color: C.ink } },
    { text: "”", options: { fontFace: F.serif, fontSize: 28, color: C.evergreen } },
  ], {
    x: MX + 0.3, y: 1.45, w: CW - 0.6, h: 0.9, align: "center", valign: "middle", margin: 0,
  });

  // 디자인 토큰 (좌)
  const tokY = 2.6;
  s.addText("디자인 토큰", {
    x: MX, y: tokY, w: 4.5, h: 0.3,
    fontFace: F.sans, fontSize: 11, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
  s.addText([
    { text: "배경 ", options: { fontFace: F.sans, fontSize: 12, color: C.inkMuted } },
    { text: "cream", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "텍스트 ", options: { fontFace: F.sans, fontSize: 12, color: C.inkMuted } },
    { text: "ink", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "액센트 ", options: { fontFace: F.sans, fontSize: 12, color: C.inkMuted } },
    { text: "evergreen (단 1색)", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.evergreen, breakLine: true } },
    { text: "폰트 ", options: { fontFace: F.sans, fontSize: 12, color: C.inkMuted } },
    { text: "노토 명조 + 노토 산스", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "그리드 ", options: { fontFace: F.sans, fontSize: 12, color: C.inkMuted } },
    { text: "8pt 정합", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink } },
  ], {
    x: MX, y: tokY + 0.4, w: 4.5, h: 1.6, valign: "top", margin: 0, paraSpaceAfter: 4,
  });

  // 反인강미학 (우)
  s.addText("反인강미학 — 의도된 정반대", {
    x: MX + 4.7, y: tokY, w: CW - 4.7, h: 0.3,
    fontFace: F.sans, fontSize: 11, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
  s.addText([
    { text: "X  ", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.inkMuted } },
    { text: "다색 배지 · 과대 카피 · 빨간 긴급 표시", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft, breakLine: true } },
    { text: "X  ", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.inkMuted } },
    { text: "“D-day 임박!” “마지막 N일 N% 할인”", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "O  ", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.evergreen } },
    { text: "공책 정합 · 세리프 헤드라인 · 단색 액센트", options: { fontFace: F.sans, fontSize: 12, color: C.ink, breakLine: true } },
    { text: "O  ", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.evergreen } },
    { text: "여백 충분 · 정직 카피 · 추정 0건", options: { fontFace: F.sans, fontSize: 12, color: C.ink } },
  ], {
    x: MX + 4.7, y: tokY + 0.4, w: CW - 4.7, h: 1.6, valign: "top", margin: 0, paraSpaceAfter: 4,
  });

  // 데모 영상 박스
  s.addShape("rect", {
    x: MX, y: 4.5, w: CW, h: 0.65,
    fill: { color: C.evergreen, transparency: 92 },
    line: { color: C.evergreen, width: 0.5, transparency: 60 },
  });
  s.addText([
    { text: "▶  ", options: { fontFace: F.sans, fontSize: 16, bold: true, color: C.evergreen } },
    { text: "데모 영상 — 첫 5초 가치 / SplitView / 모달 / 큐 점프 J-K / 다크 모드 / 모바일 (2분)", options: { fontFace: F.sans, fontSize: 14, color: C.ink } },
  ], {
    x: MX + 0.3, y: 4.5, w: CW - 0.6, h: 0.65, valign: "middle", margin: 0,
  });

  s.addNotes(
    "디자인 한 줄 — 공책 가로 괘선, 세리프 헤드라인, 학습 진척도만 컬러로 빛난다. " +
    "반대로 인강이 쓰는 다색·과대·긴급성은 절대 안 씁니다. " +
    "[데모 영상 2분 — 첫 진입 5초 가치 / SplitView / lightbox / 큐 점프 J-K / 진행률 / 다크모드 / 모바일 PWA]"
  );
}

// ─────────── Slide 5-1 차별성 정량 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 5 · 차별성");
  addTitle(s, "기존 인강 vs Fitly — 정량 비교");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 비교 테이블 (3 컬럼: 항목 / 박문각·해커스 / Fitly)
  const tblY = 1.45;
  const colWs = [2.5, 3.6, 3.1];
  const headers = ["비교 항목", "박문각 / 해커스 패스", "Fitly Pass"];
  const rows = [
    ["가격 (시즌)", "800,000 ~ 1,500,000원", "49,000원  (1/16~1/30)"],
    ["학습 모델", "단방향 인강", "SRS + 자가 채점 + AI 모범답안"],
    ["AI 활용", "없음 (또는 챗봇 보조)", "Gemini Flash (분석·튜터·팟캐)"],
    ["카피 톤", "“합격률 N% 보장”\n“마지막 D-30 패키지”", "“합격은 적합도다”\n(추정 카피 X)"],
    ["데이터", "강사 자체 정리", "24년치 공개 기출 (2002~2026)"],
  ];
  // 헤더
  let cx = MX;
  headers.forEach((h, i) => {
    const isFitly = i === 2;
    s.addText(h, {
      x: cx, y: tblY, w: colWs[i], h: 0.4,
      fontFace: F.sans, fontSize: 12, bold: true,
      color: isFitly ? C.evergreen : C.inkMuted, charSpacing: 4, valign: "middle", margin: 0,
    });
    cx += colWs[i];
  });
  addRule(s, tblY + 0.45);
  // 데이터
  rows.forEach((row, ri) => {
    const ry = tblY + 0.55 + ri * 0.62;
    let rx = MX;
    row.forEach((cell, ci) => {
      const isItem = ci === 0;
      const isFitly = ci === 2;
      s.addText(cell, {
        x: rx, y: ry, w: colWs[ci], h: 0.55,
        fontFace: F.sans,
        fontSize: isItem ? 12 : 11,
        bold: isItem || isFitly,
        color: isItem ? C.inkSoft : (isFitly ? C.evergreen : C.ink),
        valign: "top", margin: 0, paraSpaceAfter: 1,
      });
      rx += colWs[ci];
    });
    if (ri < rows.length - 1) {
      s.addShape("line", {
        x: MX, y: ry + 0.6, w: CW, h: 0,
        line: { color: C.ink, width: 0.25, transparency: 92 },
      });
    }
  });

  s.addNotes(
    "기존 박문각·해커스 패스는 시즌 80~150만원입니다. Fitly 는 49,000원 — 약 1/16에서 1/30 가격입니다. " +
    "가격만이 아니라 학습 모델 자체가 다릅니다. 인강은 단방향, Fitly 는 SRS 와 자가 채점을 결합한 양방향입니다. " +
    "AI 활용도 다릅니다. 인강 회사들은 거의 안 쓰거나 챗봇 보조 정도. 우리는 Gemini Flash 로 분석·튜터·팟캐 모두 통합합니다. " +
    "그리고 결정적으로 — 카피가 다릅니다."
  );
}

// ─────────── Slide 5-2 차별성 정성 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 5 · 차별성");
  addTitle(s, "정직성 + 反인강미학");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 좌: 정직성 원칙 (X / O 리스트)
  const halfW = (CW - 0.4) / 2;
  s.addText("정직성 원칙", {
    x: MX, y: 1.45, w: halfW, h: 0.35,
    fontFace: F.sans, fontSize: 12, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
  s.addShape("line", {
    x: MX, y: 1.85, w: halfW, h: 0,
    line: { color: C.evergreen, width: 1 },
  });
  s.addText([
    { text: "X  ", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.inkMuted } },
    { text: "합격 가능성 추정", options: { fontFace: F.sans, fontSize: 14, color: C.inkSoft, breakLine: true } },
    { text: "X  ", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.inkMuted } },
    { text: "합격 컷 추정", options: { fontFace: F.sans, fontSize: 14, color: C.inkSoft, breakLine: true } },
    { text: "X  ", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.inkMuted } },
    { text: "점수 보장 카피", options: { fontFace: F.sans, fontSize: 14, color: C.inkSoft, breakLine: true } },
    { text: "X  ", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.inkMuted } },
    { text: "“마지막 D-N 한정 N% 할인”", options: { fontFace: F.sans, fontSize: 14, color: C.inkSoft, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "O  ", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.evergreen } },
    { text: "24년치 기출 분포 (사실)", options: { fontFace: F.sans, fontSize: 14, color: C.ink, breakLine: true } },
    { text: "O  ", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.evergreen } },
    { text: "AI 모범답안과 차이 (사실)", options: { fontFace: F.sans, fontSize: 14, color: C.ink, breakLine: true } },
    { text: "O  ", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.evergreen } },
    { text: "단일 가격 (긴급도 차등 X)", options: { fontFace: F.sans, fontSize: 14, color: C.ink } },
  ], {
    x: MX, y: 2.0, w: halfW, h: 3.0, valign: "top", margin: 0, paraSpaceAfter: 4,
  });

  // 우: 反인강미학 (인강 vs Fitly)
  const rx = MX + halfW + 0.4;
  s.addText("反인강미학 — 시각적 정반대", {
    x: rx, y: 1.45, w: halfW, h: 0.35,
    fontFace: F.sans, fontSize: 12, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
  s.addShape("line", {
    x: rx, y: 1.85, w: halfW, h: 0,
    line: { color: C.evergreen, width: 1 },
  });
  s.addText([
    { text: "인강", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: " — 다색 배지", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft, breakLine: true } },
    { text: "       과대 카피", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft, breakLine: true } },
    { text: "       빨간 긴급 표시", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Fitly", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.evergreen, charSpacing: 4 } },
    { text: " — 공책 정합", options: { fontFace: F.sans, fontSize: 13, color: C.ink, breakLine: true } },
    { text: "        세리프 헤드라인", options: { fontFace: F.sans, fontSize: 13, color: C.ink, breakLine: true } },
    { text: "        단색 액센트 (1색)", options: { fontFace: F.sans, fontSize: 13, color: C.ink } },
  ], {
    x: rx, y: 2.0, w: halfW, h: 3.0, valign: "top", margin: 0, paraSpaceAfter: 4,
  });

  // 하단 한 줄 메시지
  s.addText("정직한 플래너 — 마법 아님.", {
    x: MX, y: 5.05, w: CW, h: 0.3,
    fontFace: F.serif, fontSize: 14, italic: true, bold: true,
    color: C.evergreen, align: "center", margin: 0,
  });

  s.addNotes(
    "우리는 합격 가능성을 추정하지 않습니다. 합격 컷도 추정하지 않습니다. " +
    "24년치 기출 분포 분석과 AI 모범답안 — 사실만 제공합니다. " +
    "시각도 정반대입니다. 인강이 다색·과대·긴급이라면, Fitly 는 공책·세리프·단색입니다. " +
    "정직한 플래너 — 마법 아님. 이게 우리의 차별입니다."
  );
}

// ─────────── Slide 6-1 시장 (TAM/SAM/SOM) ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 6 · 기대효과·향후계획");
  addTitle(s, "시장 규모 — TAM / SAM / SOM");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 3 펀넬 카드 (가로 배치, 점점 좁아지는 느낌으로 evergreen 농도 차)
  const cardY = 1.55;
  const cardH = 2.2;
  const cardW = (CW - 0.6) / 3;
  const cards = [
    { lbl: "TAM", v: "40,000명", n: "응시자 (연)", note: "KCEA 공시", trans: 88 },
    { lbl: "SAM", v: "15,000명", n: "디지털 결제 (38%)", note: "시장조사 추정", trans: 80 },
    { lbl: "SOM", v: "1,500명", n: "Pass 결제 (시즌 1)", note: "SEO + 유튜버 합작", trans: 70 },
  ];
  cards.forEach((c, i) => {
    const x = MX + i * (cardW + 0.3);
    s.addShape("rect", {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: C.evergreen, transparency: c.trans },
      line: { color: C.evergreen, width: 0.5, transparency: 60 },
    });
    s.addText(c.lbl, {
      x, y: cardY + 0.2, w: cardW, h: 0.35,
      fontFace: F.sans, fontSize: 12, bold: true,
      color: C.evergreen, align: "center", charSpacing: 8, margin: 0,
    });
    s.addText(c.v, {
      x, y: cardY + 0.65, w: cardW, h: 0.7,
      fontFace: F.serif, fontSize: 36, bold: true,
      color: C.ink, align: "center", valign: "middle", margin: 0,
    });
    s.addText(c.n, {
      x, y: cardY + 1.4, w: cardW, h: 0.35,
      fontFace: F.sans, fontSize: 12,
      color: C.inkSoft, align: "center", margin: 0,
    });
    s.addText(c.note, {
      x, y: cardY + 1.75, w: cardW, h: 0.35,
      fontFace: F.sans, fontSize: 10, italic: true,
      color: C.inkMuted, align: "center", margin: 0,
    });
  });

  // 매출 추정 (하단 강조)
  s.addShape("rect", {
    x: MX, y: 4.05, w: CW, h: 1.05,
    fill: { color: C.cream },
    line: { color: C.evergreen, width: 1.5 },
  });
  s.addText([
    { text: "1년차 매출 추정 ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "73,500,000원", options: { fontFace: F.serif, fontSize: 32, bold: true, color: C.evergreen, breakLine: true } },
    { text: "= 1,500명 × 49,000원   (보수적 가설치)", options: { fontFace: F.sans, fontSize: 11, italic: true, color: C.inkMuted } },
  ], {
    x: MX, y: 4.1, w: CW, h: 0.95, align: "center", valign: "middle", margin: 0, paraSpaceAfter: 3,
  });

  s.addNotes(
    "시장 규모는 TAM 4만, SAM 디지털 결제 1.5만, 우리 SOM 첫 시즌 1500명 결제 가설입니다. " +
    "1년차 매출 추정 7,350만원 — 49,000원 × 1500명입니다. " +
    "보수적 가정이고, 시즌 2 이후는 누적 효과로 증가 모델입니다."
  );
}

// ─────────── Slide 6-2 BM 한 장 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 6 · 기대효과·향후계획");
  addTitle(s, "비즈니스 모델 — Free + Pass");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 2 컬럼 (Free / Pass)
  const colsY = 1.5;
  const colsH = 3.2;
  const halfW = (CW - 0.4) / 2;

  // Free
  s.addShape("rect", {
    x: MX, y: colsY, w: halfW, h: colsH,
    fill: { color: C.cream },
    line: { color: C.ink, width: 0.5, transparency: 80 },
  });
  s.addText("Free", {
    x: MX, y: colsY + 0.2, w: halfW, h: 0.4,
    fontFace: F.sans, fontSize: 14, bold: true,
    color: C.inkMuted, align: "center", charSpacing: 6, margin: 0,
  });
  s.addText("0원", {
    x: MX, y: colsY + 0.6, w: halfW, h: 0.55,
    fontFace: F.serif, fontSize: 32, bold: true,
    color: C.ink, align: "center", margin: 0,
  });
  s.addShape("line", {
    x: MX + 0.5, y: colsY + 1.3, w: halfW - 1.0, h: 0,
    line: { color: C.ink, width: 0.5, transparency: 80 },
  });
  s.addText([
    { text: "✓  가입 + 시험일 입력", options: { fontFace: F.sans, fontSize: 12, color: C.ink, breakLine: true } },
    { text: "✓  마이 페이지", options: { fontFace: F.sans, fontSize: 12, color: C.ink, breakLine: true } },
    { text: "✓  기출분석 풀 (히트맵·토픽맵)", options: { fontFace: F.sans, fontSize: 12, color: C.ink, breakLine: true } },
    { text: "✓  팟캐 시드 라이브러리 N편", options: { fontFace: F.sans, fontSize: 12, color: C.ink, breakLine: true } },
    { text: "✓  풀이 트랙 5장/일 (체험)", options: { fontFace: F.sans, fontSize: 12, color: C.ink } },
  ], {
    x: MX + 0.4, y: colsY + 1.5, w: halfW - 0.8, h: 1.6, valign: "top", margin: 0, paraSpaceAfter: 6,
  });

  // Pass
  const px = MX + halfW + 0.4;
  s.addShape("rect", {
    x: px, y: colsY, w: halfW, h: colsH,
    fill: { color: C.evergreen, transparency: 92 },
    line: { color: C.evergreen, width: 1.5 },
  });
  s.addText("Pass", {
    x: px, y: colsY + 0.2, w: halfW, h: 0.4,
    fontFace: F.sans, fontSize: 14, bold: true,
    color: C.evergreen, align: "center", charSpacing: 6, margin: 0,
  });
  s.addText("49,000원", {
    x: px, y: colsY + 0.6, w: halfW, h: 0.55,
    fontFace: F.serif, fontSize: 32, bold: true,
    color: C.evergreen, align: "center", margin: 0,
  });
  s.addText("시험일까지 fixed · 7일 무조건 환불", {
    x: px, y: colsY + 1.15, w: halfW, h: 0.25,
    fontFace: F.sans, fontSize: 10, italic: true,
    color: C.inkMuted, align: "center", margin: 0,
  });
  s.addShape("line", {
    x: px + 0.5, y: colsY + 1.45, w: halfW - 1.0, h: 0,
    line: { color: C.evergreen, width: 0.5, transparency: 60 },
  });
  s.addText([
    { text: "✓  무제한 SRS (3 트랙)", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "✓  AI 모범답안 + 5탭 분석", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "✓  AI 학습 도우미 (튜터 챗봇)", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "✓  팟캐스트 자동 생성", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "✓  워크스페이스 풀 (마크/필터/이력)", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink } },
  ], {
    x: px + 0.4, y: colsY + 1.65, w: halfW - 0.8, h: 1.5, valign: "top", margin: 0, paraSpaceAfter: 6,
  });

  // 하단 핵심 카피
  s.addText("박문각 패스 1/24 가격, 인강이 못 하는 분석·자가 채점·자동 팟캐스트.", {
    x: MX, y: 5.0, w: CW, h: 0.35,
    fontFace: F.serif, fontSize: 14, italic: true, bold: true,
    color: C.evergreen, align: "center", margin: 0,
  });

  s.addNotes(
    "BM 은 단순합니다. 무료 진입 — 분석과 팟캐 시드를 풀어 마법 지점 체험. " +
    "Pass 49,000원 — 시험일까지 fixed, 자동 갱신 없고 7일 무조건 환불. " +
    "학습 그라인드 전체와 AI 무제한이 Pass 에 들어갑니다. " +
    "박문각 패스 1/24 가격이 핵심 카피입니다."
  );
}

// ─────────── Slide 6-3 GTM + 로드맵 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 6 · 기대효과·향후계획");
  addTitle(s, "GTM 2 트랙 + 12개월 로드맵");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 좌: GTM 2 트랙
  const halfW = (CW - 0.4) / 2;
  s.addText("GTM 2 트랙", {
    x: MX, y: 1.45, w: halfW, h: 0.3,
    fontFace: F.sans, fontSize: 11, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
  // 단기
  // 2026-05-16 — Gemini 외부 평가 (시장 이해도) 반영: 교대생 특화 커뮤니티 바이럴
  // 키워드 추가 (에브리타임·초임공). 타겟층 밀집 채널 명시로 GTM 신뢰도 보강.
  s.addShape("rect", {
    x: MX, y: 1.85, w: halfW, h: 1.55,
    fill: { color: C.creamSoft },
    line: { color: C.ruleStrong, width: 0.5 },
  });
  s.addText([
    { text: "단기  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "유튜버 합작 + 교대 커뮤니티 바이럴", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.ink, breakLine: true } },
    { text: " ", options: { fontSize: 4, breakLine: true } },
    { text: "임용 유튜버 5~10명 무료 Pass +", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft, breakLine: true } },
    { text: "콘텐츠 합작 1편씩 발행", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft, breakLine: true } },
    { text: "교대 ", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft } },
    { text: "에브리타임·초임공", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink } },
    { text: " 시드 후기 + 무료 체험", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft } },
  ], { x: MX + 0.25, y: 1.95, w: halfW - 0.5, h: 1.4, valign: "top", margin: 0, paraSpaceAfter: 2 });

  // 장기
  s.addShape("rect", {
    x: MX, y: 3.5, w: halfW, h: 1.2,
    fill: { color: C.creamSoft },
    line: { color: C.ruleStrong, width: 0.5 },
  });
  s.addText([
    { text: "장기  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "콘텐츠 SEO", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.ink, breakLine: true } },
    { text: " ", options: { fontSize: 4, breakLine: true } },
    { text: "24년치 데이터 자산 → 블로그", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft, breakLine: true } },
    { text: "주 2편, 50편 발행 시 long-tail 안정", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft } },
  ], { x: MX + 0.25, y: 3.6, w: halfW - 0.5, h: 1.0, valign: "top", margin: 0, paraSpaceAfter: 2 });

  // 우: 로드맵 타임라인
  const rx = MX + halfW + 0.4;
  s.addText("12개월 로드맵", {
    x: rx, y: 1.45, w: halfW, h: 0.3,
    fontFace: F.sans, fontSize: 11, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
  // 세로 타임라인
  const tlX = rx + 0.15;
  const tlY = 1.95;
  const tlH = 2.7;
  s.addShape("line", {
    x: tlX, y: tlY, w: 0, h: tlH,
    line: { color: C.evergreen, width: 1.5 },
  });
  const milestones = [
    { d: "2026-06", t: "시드 적재 + 유튜버 컨택" },
    { d: "2026-07", t: "클로즈드 베타 (50~100명)" },
    { d: "2026-08", t: "오픈 베타" },
    { d: "2026-09", t: "정식 출시 (Pass 활성)" },
    { d: "2026-12", t: "시즌 1 종료 + 후기 수집" },
    { d: "2027-03", t: "시즌 2 v2 정식 출시" },
  ];
  const mY = (tlH - 0.1) / (milestones.length - 1);
  milestones.forEach((m, i) => {
    const my = tlY + i * mY;
    // 점
    s.addShape("oval", {
      x: tlX - 0.08, y: my - 0.08, w: 0.16, h: 0.16,
      fill: { color: C.evergreen },
      line: { color: C.evergreen, width: 0 },
    });
    // 날짜
    s.addText(m.d, {
      x: tlX + 0.2, y: my - 0.13, w: 0.9, h: 0.25,
      fontFace: F.sans, fontSize: 10, bold: true,
      color: C.evergreen, charSpacing: 2, valign: "middle", margin: 0,
    });
    // 마일스톤 텍스트
    s.addText(m.t, {
      x: tlX + 1.15, y: my - 0.13, w: halfW - 1.3, h: 0.25,
      fontFace: F.sans, fontSize: 12,
      color: C.ink, valign: "middle", margin: 0,
    });
  });

  // 하단 카피
  s.addText("이번 시즌 베타 검증 → 시즌 2 본 운영.", {
    x: MX, y: 5.0, w: CW, h: 0.3,
    fontFace: F.serif, fontSize: 13, italic: true, bold: true,
    color: C.evergreen, align: "center", margin: 0,
  });

  s.addNotes(
    "GTM 은 두 축입니다. 단기 — 임용 유튜버 5~10명에게 무료 Pass 와 콘텐츠 합작. " +
    "그리고 교대생이 극도로 밀집한 에브리타임·초임공 커뮤니티에 시드 후기와 무료 체험을 풀어 " +
    "타겟층 바이럴을 일으킵니다. " +
    "장기 — 24년치 데이터를 SEO 블로그로 풀어 검색 유입. " +
    "12개월 로드맵은 7월 베타, 9월 정식, 12월 시즌 1 종료, 2027년 3월 시즌 2 v2 출시. " +
    "첫 시즌 데이터로 PMF 검증 후 v2 로 본격 운영합니다."
  );
}

// ─────────── Slide 7-1 회고 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  addPartLabel(s, "PART 7 · 회고·소회");
  addTitle(s, "AI 협업 회고 — 14일");
  addRule(s, MY + 1.05);
  addFooter(s, pageNo);

  // 상단: 14일 통계
  s.addText([
    { text: "225 ", options: { fontFace: F.serif, fontSize: 32, bold: true, color: C.evergreen } },
    { text: "commits   ·   ", options: { fontFace: F.sans, fontSize: 13, color: C.inkMuted } },
    { text: "56 ", options: { fontFace: F.serif, fontSize: 32, bold: true, color: C.evergreen } },
    { text: "PR   ·   ", options: { fontFace: F.sans, fontSize: 13, color: C.inkMuted } },
    { text: "6 ", options: { fontFace: F.serif, fontSize: 32, bold: true, color: C.evergreen } },
    { text: "단계 PR 시리즈", options: { fontFace: F.sans, fontSize: 13, color: C.inkMuted } },
  ], {
    x: MX, y: 1.25, w: CW, h: 0.7, align: "center", valign: "middle", margin: 0,
  });

  // 2026-05-16 — 두 박스 가로 분할. 주인님 요청: AI 통제(헌법 시스템) 경험을
  // silent fallback 회고와 동등 비중으로 노출. 회고 핵심 메시지를 "규율 + 정직"
  // 으로 묶어 발표 톤 강화.
  const recapHalfW = (CW - 0.3) / 2;
  const boxY = 2.05;
  const boxH = 2.5;

  // 좌: 헌법 시스템 — AI 통제
  s.addShape("rect", {
    x: MX, y: boxY, w: recapHalfW, h: boxH,
    fill: { color: C.evergreen, transparency: 92 },
    line: { color: C.evergreen, width: 1 },
  });
  s.addText("규율 — 헌법 시스템으로 AI 통제", {
    x: MX + 0.25, y: boxY + 0.15, w: recapHalfW - 0.5, h: 0.32,
    fontFace: F.sans, fontSize: 12, bold: true,
    color: C.evergreen, charSpacing: 4, margin: 0,
  });
  s.addText([
    { text: "종전  ", options: { fontFace: F.sans, fontSize: 10, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "단일 ", options: { fontFace: F.sans, fontSize: 11, color: C.ink } },
    { text: "CLAUDE.md ", options: { fontFace: F.sans, fontSize: 11, italic: true, color: C.ink } },
    { text: "지침서 → AI 가 자주 말을 안 듣고 스코프 폭주", options: { fontFace: F.sans, fontSize: 11, color: C.ink, breakLine: true } },
    { text: "전환  ", options: { fontFace: F.sans, fontSize: 10, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "4 계층 위계 (한국 법체계 정합)", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.ink, breakLine: true } },
    { text: "        헌법 / 법률 / 시행령 / 시행규칙", options: { fontFace: F.sans, fontSize: 10.5, italic: true, color: C.inkSoft, breakLine: true } },
    { text: "결과  ", options: { fontFace: F.sans, fontSize: 10, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "모든 결정 → 헌법 조항 ", options: { fontFace: F.sans, fontSize: 11, color: C.ink } },
    { text: "근거 명시 의무", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.ink, breakLine: true } },
    { text: "        신규 기능 자가 추가 금지 (스코프 보호)", options: { fontFace: F.sans, fontSize: 10.5, italic: true, color: C.inkSoft } },
  ], {
    x: MX + 0.25, y: boxY + 0.5, w: recapHalfW - 0.5, h: boxH - 0.65,
    valign: "top", margin: 0, paraSpaceAfter: 4,
  });

  // 우: 정직 — silent fallback 회귀
  const rx = MX + recapHalfW + 0.3;
  s.addShape("rect", {
    x: rx, y: boxY, w: recapHalfW, h: boxH,
    fill: { color: C.evergreen, transparency: 92 },
    line: { color: C.evergreen, width: 1 },
  });
  s.addText("정직 — silent fallback 회귀 (PR #71)", {
    x: rx + 0.25, y: boxY + 0.15, w: recapHalfW - 0.5, h: 0.32,
    fontFace: F.sans, fontSize: 12, bold: true,
    color: C.evergreen, charSpacing: 4, margin: 0,
  });
  s.addText([
    { text: "증상  ", options: { fontFace: F.sans, fontSize: 10, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "채점 후 AI 총평·키워드·diff 모두 빈 화면", options: { fontFace: F.sans, fontSize: 11, color: C.ink, breakLine: true } },
    { text: "원인  ", options: { fontFace: F.sans, fontSize: 10, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "LLM JSON 파싱 실패 시 ", options: { fontFace: F.sans, fontSize: 11, color: C.ink } },
    { text: "조용히 빈 배열 fallback", options: { fontFace: F.sans, fontSize: 11, italic: true, bold: true, color: C.ink, breakLine: true } },
    { text: "        → UI 가 “성공인데 빈 답안” 으로 오안내", options: { fontFace: F.sans, fontSize: 10.5, italic: true, color: C.inkSoft, breakLine: true } },
    { text: "해결  ", options: { fontFace: F.sans, fontSize: 10, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "명시 throw + 진단 로그", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.ink, breakLine: true } },
    { text: "        + 출력 토큰 2048 → 4096 격상", options: { fontFace: F.sans, fontSize: 10.5, italic: true, color: C.inkSoft } },
  ], {
    x: rx + 0.25, y: boxY + 0.5, w: recapHalfW - 0.5, h: boxH - 0.65,
    valign: "top", margin: 0, paraSpaceAfter: 4,
  });

  // 배움 — 두 박스의 핵심을 한 줄로
  s.addText([
    { text: "배움  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.evergreen, charSpacing: 4 } },
    { text: "AI 협업은 ", options: { fontFace: F.serif, fontSize: 14, italic: true, color: C.ink } },
    { text: "규율과 정직", options: { fontFace: F.serif, fontSize: 14, italic: true, bold: true, color: C.evergreen } },
    { text: " — 헌법으로 통제, fallback 은 명시 에러로 surface.", options: { fontFace: F.serif, fontSize: 14, italic: true, color: C.ink } },
  ], {
    x: MX, y: 4.75, w: CW, h: 0.4, align: "center", valign: "middle", margin: 0,
  });

  s.addNotes(
    "마지막으로, 14일 AI 협업 회고를 짧게. " +
    "225 commits, 56 PR — 프로젝트 원칙 문서까지 4 계층으로 진화시켰습니다. " +
    "회고는 두 축으로 묶었습니다. " +
    "첫째, 규율 — 처음에는 단일 CLAUDE.md 지침서로 AI 에게 명령했지만, " +
    "AI 가 자주 말을 안 들었고 스코프가 폭주했습니다. " +
    "그래서 한국 법체계처럼 4 계층 위계 — 헌법, 법률, 시행령, 시행규칙 — 으로 분리하고, " +
    "모든 결정에 헌법 조항 근거를 명시하도록 의무화했습니다. " +
    "이후 AI 가 임의로 신규 기능을 추가하는 일이 사라졌습니다. " +
    "둘째, 정직 — AI 분석 결과가 빈 화면으로 표시되는 회귀였습니다. " +
    "LLM JSON 파싱 실패 시 코드가 조용히 빈 배열로 fallback 하고 있었습니다. " +
    "여기서 배운 원칙은, fallback 은 명시 에러로 surface 해야 한다, silent 는 사용자에게 정직하지 않다. " +
    "감사합니다."
  );
}

// ─────────── Slide 마지막 컷 ───────────
{
  const s = pres.addSlide({ masterName: "FITLY_PAPER" });
  pageNo += 1;

  // 메인 헤드라인
  s.addText("Fitly", {
    x: MX, y: 1.3, w: CW, h: 1.0,
    fontFace: F.serif, fontSize: 84, bold: true,
    color: C.ink, align: "center", valign: "middle", margin: 0,
  });

  s.addText("합격은 시간이 아니라 적합도다.", {
    x: MX, y: 2.4, w: CW, h: 0.6,
    fontFace: F.serif, fontSize: 22,
    color: C.evergreen, align: "center", valign: "middle", margin: 0,
  });

  addRule(s, 3.2);

  // 베타 모집
  s.addText([
    { text: "2026년 7월", options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.evergreen, charSpacing: 4 } },
    { text: "  클로즈드 베타 모집 예정", options: { fontFace: F.sans, fontSize: 14, color: C.inkSoft, breakLine: true } },
    { text: " ", options: { fontSize: 12, breakLine: true } },
    { text: "[랜딩 URL]   ·   [팀 연락처]", options: { fontFace: F.sans, fontSize: 12, italic: true, color: C.inkMuted } },
  ], {
    x: MX, y: 3.5, w: CW, h: 1.5, align: "center", valign: "top", margin: 0, paraSpaceAfter: 6,
  });

  s.addText("감사합니다.", {
    x: MX, y: 5.0, w: CW, h: 0.35,
    fontFace: F.serif, fontSize: 14, italic: true,
    color: C.inkMuted, align: "center", margin: 0,
  });

  s.addNotes("발표 종료. 베타 모집 + 팀 연락처 노출.");
}

// ─────────── 출력 ───────────
pres.writeFile({ fileName: "발표.pptx" })
  .then((name) => console.log(`✓ 생성 완료: ${name} (총 ${pageNo} 슬라이드)`))
  .catch((e) => { console.error("✗ 실패:", e); process.exit(1); });
