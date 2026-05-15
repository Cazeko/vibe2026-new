// Fitly 발표 .pptx 빌더 (2026-05-16 — Skywork 예시 톤 정합)
//
// 출력: fitly/발표.pptx (14 슬라이드, 16:9 WIDE 13.333×7.5")
//
// 구성:
//   슬라이드 1, 3, 5, 6, 7  → 예시 PNG 풀스크린 배경 (assets/slide-NN-*.png)
//   슬라이드 2, 4, 8~14    → pptxgenjs 신규 작성 (예시 PNG 톤 정합)
//
// 예시 PNG 톤 (Skywork.ai 출처):
//   cream bg #F9F5EA · ink #15172D · evergreen #2F5D50 · muted #8A8478
//   헤드라인 Noto Serif KR Black ~ 56pt / 한 단어만 evergreen 강조
//   PART 라벨 좌상단 11pt sans bold evergreen + 글자간 spacing
//   가는 가로 rule + 우측 푸터 번호

const pptxgen = require("pptxgenjs");
const path = require("path");

// ─────────── 디자인 토큰 (예시 PNG 정합) ───────────
const C = {
  cream: "F9F5EA",
  creamSoft: "FCFAF2",
  creamDeep: "EFE9DC",
  ink: "15172D",
  inkSoft: "2A2C3E",
  inkMuted: "8A8478",
  evergreen: "2F5D50",
  evergreenSoft: "6B8478",
  rule: "DCD5C5",
  ruleStrong: "B8AF98",
};
const F = {
  serif: "Noto Serif KR",
  sans: "Noto Sans KR",
};

// 슬라이드 사이즈
const W = 13.333;
const H = 7.5;
const MX = 0.65;
const MY = 0.55;
const CW = W - MX * 2;

// ─────────── 헬퍼 ───────────
function partLabel(s, label) {
  s.addText(label, {
    x: MX, y: MY, w: 6, h: 0.32,
    fontFace: F.sans, fontSize: 12, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
}
function pageRule(s, y) {
  s.addShape("line", {
    x: MX, y, w: CW, h: 0,
    line: { color: C.ruleStrong, width: 0.5 },
  });
}
function footerNum(s, n) {
  s.addText(String(n).padStart(2, "0"), {
    x: W - MX - 1, y: H - 0.55, w: 1, h: 0.3,
    fontFace: F.sans, fontSize: 10,
    color: C.inkMuted, align: "right", margin: 0,
  });
  s.addText("Fitly", {
    x: MX, y: H - 0.55, w: 2, h: 0.3,
    fontFace: F.serif, fontSize: 11, italic: true,
    color: C.inkMuted, margin: 0,
  });
}
// 큰 세리프 헤드라인 — 일부 단어는 evergreen 강조
function bigTitle(s, runs, opts = {}) {
  s.addText(runs, {
    x: MX, y: opts.y ?? 1.15, w: CW, h: opts.h ?? 1.4,
    fontFace: F.serif, fontSize: opts.size ?? 52, bold: true,
    color: C.ink, valign: "top", margin: 0,
    paraSpaceAfter: 0,
  });
}

// ─────────── 빌더 ───────────
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 inches
pres.title = "Fitly — 합격은 시간이 아니라 적합도다";
pres.author = "편돌이들";
pres.subject = "한국 초등교사 임용 1차 학습 플래너 PWA";

// ─────────── PNG 풀스크린 헬퍼 ───────────
function pngSlide(filename) {
  const s = pres.addSlide();
  s.background = { color: C.cream };
  s.addImage({
    path: path.join(__dirname, "assets", filename),
    x: 0, y: 0, w: W, h: H,
  });
  return s;
}

let pageNo = 0;

// ─────────── Slide 1 — 표지 (PNG) ───────────
{
  const s = pngSlide("slide-01-cover.png");
  pageNo += 1;
  s.addNotes(
    "안녕하세요, 편돌이들 팀입니다. " +
    "저희가 만든 Fitly 를 소개해 드리겠습니다. " +
    "한국 초등교사 임용 1차 시험 학습 플래너 PWA 입니다. " +
    "펀치라인은 — 합격은 시간이 아니라 적합도다."
  );
}

// ─────────── Slide 2 — PART 1 · 문제 (신규) ───────────
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  pageNo += 1;

  partLabel(s, "PART 1 · 문제");
  bigTitle(s, [
    { text: "24년치 데이터는 ", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink } },
    { text: "공개", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.evergreen } },
    { text: "되어 있는데,", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink, breakLine: true } },
    { text: "내 약점은 ", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink } },
    { text: "보이지 않는다.", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.evergreen } },
  ], { y: 1.1, h: 2.6 });
  pageRule(s, 3.85);

  // KPI 3 — 큰 숫자
  const kpis = [
    { v: "4만+", k: "연 응시자", sub: "초등 임용 1차" },
    { v: "1년 1회", k: "시험 횟수", sub: "11월 단발" },
    { v: "24년치", k: "공개 기출", sub: "1997~2024 교직·교육과정" },
  ];
  const kpiW = (CW - 0.6) / 3;
  kpis.forEach((k, i) => {
    const x = MX + i * (kpiW + 0.3);
    s.addText(k.v, {
      x, y: 4.15, w: kpiW, h: 0.95,
      fontFace: F.serif, fontSize: 52, bold: true,
      color: C.evergreen, valign: "bottom", margin: 0,
    });
    s.addText(k.k, {
      x, y: 5.18, w: kpiW, h: 0.35,
      fontFace: F.sans, fontSize: 14, bold: true,
      color: C.ink, charSpacing: 2, margin: 0,
    });
    s.addText(k.sub, {
      x, y: 5.55, w: kpiW, h: 0.3,
      fontFace: F.sans, fontSize: 11,
      color: C.inkMuted, margin: 0,
    });
  });

  // 하단 기존 시장 + 문제 인용
  s.addText([
    { text: "기존 시장  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "박문각·해커스 인강 패스 ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "80~150만원/시즌", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink } },
    { text: "  ·  종로 모의 ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "9만원/3회", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink } },
  ], {
    x: MX, y: 6.4, w: CW, h: 0.4, valign: "middle", margin: 0,
  });

  footerNum(s, pageNo);
  s.addNotes(
    "한국 초등교사 임용 1차는 매년 4만 명 이상이 응시하는, 1년에 단 1회 열리는 시험입니다. " +
    "기출은 24년치가 공개돼 있는데도 — 박문각·해커스 인강 패스 80에서 150만원, " +
    "종로 모의고사 9만원 — 비용이 만만치 않습니다. " +
    "근데 정작 그 돈을 써도, 내 약점이 어디인지 정확히 보이지 않습니다. 이게 시작점이었습니다."
  );
}

// ─────────── Slide 3 — PART 2 · 페르소나 (PNG) ───────────
{
  pngSlide("slide-03-persona.png");
  pageNo += 1;
}

// ─────────── Slide 4 — PART 3 · 솔루션 매핑 (신규) ───────────
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  pageNo += 1;

  partLabel(s, "PART 3 · 솔루션 매핑");
  bigTitle(s, [
    { text: "페인 3 → ", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink } },
    { text: "가치 3", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.evergreen } },
    { text: ", 정확히 1:1.", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink } },
  ], { y: 1.15, h: 1.2 });
  pageRule(s, 2.5);

  // 3 매핑 행
  const rows = [
    { num: "01", pain: "진단 부재", painSub: "24년치 데이터가 공개돼도 내 약점이 어디인지 모름", value: "기출 분포 히트맵 + 영역 · 인지수준 · 형식 분석" },
    { num: "02", pain: "채점 모호", painSub: "서술형 답안을 누가 어떻게 채점해주는지 불투명", value: "AI 모범답안 + 자가 채점 4 버튼 + 답안 차이 diff" },
    { num: "03", pain: "이동 시간", painSub: "학원 왕복 1.5시간이 매일 학습 시간 잠식", value: "PWA 어디서나 + Gemini TTS 팟캐스트로 이동 중 학습" },
  ];
  const rowY = 3.0;
  const rowH = 1.05;
  const gap = 0.15;
  rows.forEach((r, i) => {
    const y = rowY + i * (rowH + gap);
    // 번호 — 좌측 큰 세리프
    s.addText(r.num, {
      x: MX, y: y, w: 1.0, h: rowH,
      fontFace: F.serif, fontSize: 38, bold: true,
      color: C.evergreen, valign: "middle", margin: 0,
    });
    // 좌측 페인
    s.addText([
      { text: r.pain, options: { fontFace: F.sans, fontSize: 17, bold: true, color: C.ink, breakLine: true } },
      { text: r.painSub, options: { fontFace: F.sans, fontSize: 12, color: C.inkMuted } },
    ], {
      x: MX + 1.05, y: y + 0.05, w: 4.55, h: rowH - 0.1,
      valign: "middle", margin: 0, paraSpaceAfter: 3,
    });
    // 화살표
    s.addText("→", {
      x: MX + 5.7, y: y, w: 0.55, h: rowH,
      fontFace: F.serif, fontSize: 24, bold: true,
      color: C.evergreenSoft, align: "center", valign: "middle", margin: 0,
    });
    // 우측 가치
    s.addText(r.value, {
      x: MX + 6.3, y: y, w: CW - 6.3, h: rowH,
      fontFace: F.sans, fontSize: 14, bold: true,
      color: C.ink, valign: "middle", margin: 0,
    });
    if (i < rows.length - 1) {
      s.addShape("line", {
        x: MX, y: y + rowH + gap / 2, w: CW, h: 0,
        line: { color: C.rule, width: 0.5 },
      });
    }
  });

  // 하단 펀치라인
  s.addText("합격은 시간이 아니라 적합도다.", {
    x: MX, y: 6.5, w: CW, h: 0.5,
    fontFace: F.serif, fontSize: 22, italic: true, bold: true,
    color: C.evergreen, align: "center", margin: 0,
  });

  footerNum(s, pageNo);
  s.addNotes(
    "김지원 선생님의 세 가지 페인을, 저희는 가치 세 가지로 정확히 1대 1 매핑했습니다. " +
    "진단 부재는 기출 분포 히트맵으로, 채점 모호는 AI 모범답안과 자가 채점 4 버튼으로, " +
    "이동 시간은 PWA 와 Gemini TTS 팟캐스트로 해소합니다. " +
    "펀치라인 한 줄로 압축하면 — 합격은 시간이 아니라 적합도다."
  );
}

// ─────────── Slide 5 — PART 4 · 핵심 기능 (PNG) ───────────
{ pngSlide("slide-05-features.png"); pageNo += 1; }

// ─────────── Slide 6 — PART 4 · 데이터 파이프라인 (PNG) ───────────
{ pngSlide("slide-06-pipeline.png"); pageNo += 1; }

// ─────────── Slide 7 — PART 5 · 디자인 철학 (PNG) ───────────
{ pngSlide("slide-07-philosophy.png"); pageNo += 1; }

// ─────────── Slide 8 — PART 5 · 데모 (작동성 3분) (신규) ───────────
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  pageNo += 1;

  partLabel(s, "PART 5 · 데모 영상");
  bigTitle(s, [
    { text: "작동성 ", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink } },
    { text: "3분", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.evergreen } },
    { text: " — 6 핵심 흐름.", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink } },
  ], { y: 1.15, h: 1.2 });
  pageRule(s, 2.55);

  // 영상 placeholder 영역 (좌)
  s.addShape("rect", {
    x: MX, y: 3.05, w: 5.6, h: 3.3,
    fill: { color: C.creamSoft },
    line: { color: C.ruleStrong, width: 0.75 },
  });
  s.addText("▶  데모 영상 (작동성)", {
    x: MX, y: 3.05, w: 5.6, h: 1.65,
    fontFace: F.sans, fontSize: 18, bold: true,
    color: C.evergreen, align: "center", valign: "bottom", margin: 0,
  });
  s.addText("3 분 · 1280×720 · MP4", {
    x: MX, y: 4.7, w: 5.6, h: 0.5,
    fontFace: F.sans, fontSize: 12,
    color: C.inkMuted, align: "center", valign: "top", margin: 0,
  });
  s.addText("(영상 파일 임베드 자리)", {
    x: MX, y: 5.2, w: 5.6, h: 1.0,
    fontFace: F.sans, fontSize: 11, italic: true,
    color: C.inkMuted, align: "center", valign: "top", margin: 0,
  });

  // 우측 흐름 — 6 단계 리스트
  const flow = [
    ["01", "가입 30초", "이메일 + 시험일·지역 1회 입력"],
    ["02", "대시보드", "내 약점 한 줄 + 오늘의 플랜"],
    ["03", "기출 분석", "4 탭 — 시험지·히트맵·토픽맵·로드맵"],
    ["04", "풀이 5탭", "본문 → 답안 입력 → AI 채점 → 자가 채점"],
    ["05", "팟캐스트", "Gemini TTS 멀티 화자 강의 오디오"],
    ["06", "워크스페이스", "SplitView 좌(본문) · 우(분석)"],
  ];
  const fX = MX + 6.0;
  const fY = 3.05;
  const fW = CW - 6.0;
  const fH = 0.55;
  flow.forEach((row, i) => {
    const y = fY + i * fH;
    s.addText(row[0], {
      x: fX, y, w: 0.55, h: fH,
      fontFace: F.serif, fontSize: 18, bold: true,
      color: C.evergreen, valign: "middle", margin: 0,
    });
    s.addText([
      { text: row[1] + "  ", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink } },
      { text: row[2], options: { fontFace: F.sans, fontSize: 11, color: C.inkMuted } },
    ], {
      x: fX + 0.55, y, w: fW - 0.55, h: fH, valign: "middle", margin: 0,
    });
  });

  // 하단 카피
  s.addText("“가입 30초, 첫 학습 시작 1분 내.”", {
    x: MX, y: 6.65, w: CW, h: 0.4,
    fontFace: F.serif, fontSize: 16, italic: true,
    color: C.evergreen, align: "center", margin: 0,
  });

  footerNum(s, pageNo);
  s.addNotes(
    "이제 데모 영상을 보여드리겠습니다. 작동성 3 분 분량입니다. " +
    "가입 30 초, 대시보드 진입, 기출 분석 4 탭, 풀이 트랙 5 탭, 팟캐스트, 워크스페이스 SplitView — " +
    "총 6 개 흐름을 매끄럽게 시연합니다. " +
    "특히 풀이 트랙에서는 본문 검토부터 답안 입력, AI 채점, 자가 채점까지 전 과정이 카드 한 장 안에서 끝납니다."
  );
}

// ─────────── Slide 9 — PART 5 · 데모 (사용성 2분) (신규) ───────────
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  pageNo += 1;

  partLabel(s, "PART 5 · 데모 영상");
  bigTitle(s, [
    { text: "사용성 ", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink } },
    { text: "2분", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.evergreen } },
    { text: " — 6 시그니처 인터랙션.", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink } },
  ], { y: 1.15, h: 1.2 });
  pageRule(s, 2.55);

  const flow = [
    ["01", "첫 5초 가치", "진입 직후 “내 약점 한 줄” 노출 (정직성)"],
    ["02", "SplitView", "좌(본문) · 우(답안→분석) 분할, 비율 35~65%"],
    ["03", "모달 학습 뷰어", "기출 PDF 본문 lightbox + 4 단계 줌"],
    ["04", "큐 점프 J·K", "키보드 1/2/3/4 채점 + J·K 카드 이동"],
    ["05", "다크 모드", "토글 1 회 — 사이드바·카드·차트 일관 톤"],
    ["06", "모바일 PWA", "오프라인 캐싱 + 홈 화면 추가 + 햄버거 drawer"],
  ];
  // 2×3 grid
  const colW = (CW - 0.4) / 2;
  const rowH = 1.05;
  flow.forEach((row, i) => {
    const col = i % 2;
    const r = Math.floor(i / 2);
    const x = MX + col * (colW + 0.4);
    const y = 3.0 + r * (rowH + 0.18);
    // 카드
    s.addShape("rect", {
      x, y, w: colW, h: rowH,
      fill: { color: C.creamSoft },
      line: { color: C.ruleStrong, width: 0.5 },
    });
    s.addText(row[0], {
      x: x + 0.3, y: y + 0.15, w: 0.7, h: rowH - 0.3,
      fontFace: F.serif, fontSize: 24, bold: true,
      color: C.evergreen, valign: "middle", margin: 0,
    });
    s.addText([
      { text: row[1], options: { fontFace: F.sans, fontSize: 14, bold: true, color: C.ink, breakLine: true } },
      { text: row[2], options: { fontFace: F.sans, fontSize: 11, color: C.inkMuted } },
    ], {
      x: x + 1.05, y: y + 0.18, w: colW - 1.2, h: rowH - 0.36,
      valign: "middle", margin: 0, paraSpaceAfter: 3,
    });
  });

  s.addText("“키보드만으로 30 카드 연속 학습 가능.”", {
    x: MX, y: 6.7, w: CW, h: 0.4,
    fontFace: F.serif, fontSize: 16, italic: true,
    color: C.evergreen, align: "center", margin: 0,
  });

  footerNum(s, pageNo);
  s.addNotes(
    "사용성 데모 2 분입니다. 6 가지 시그니처 인터랙션을 보여드립니다. " +
    "첫 5 초 안에 내 약점 한 줄이 떠야 한다 — 이게 정직성의 시작입니다. " +
    "SplitView, 모달 학습 뷰어, 키보드 단축키, 다크 모드, 모바일 PWA 까지 — " +
    "에듀테크에서 흔치 않은 매끄러운 인터랙션을 빠르게 시연합니다."
  );
}

// ─────────── Slide 10 — PART 6 · TAM/SAM/SOM (신규) ───────────
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  pageNo += 1;

  partLabel(s, "PART 6 · 시장 규모");
  bigTitle(s, [
    { text: "TAM 4만 · SAM 1.5만 · ", options: { fontFace: F.serif, fontSize: 46, bold: true, color: C.ink } },
    { text: "SOM 1,500", options: { fontFace: F.serif, fontSize: 46, bold: true, color: C.evergreen } },
  ], { y: 1.15, h: 1.2, size: 46 });
  pageRule(s, 2.55);

  // 3 단 위계 — 같은 폭, 위→아래 다른 transparency 배경 (집중 시각화)
  const tiers = [
    { tag: "TAM", v: "4만명", note: "초등 임용 1차 연 응시자 (KICE 공개 통계)", trans: 88 },
    { tag: "SAM", v: "1.5만명", note: "디지털 학습 결제 의향 (37.5%, 자체 설문 가설)", trans: 80 },
    { tag: "SOM", v: "1,500명", note: "Pass 결제 (시즌 1) — SEO + 유튜버 합작 + 교대 커뮤니티 바이럴", trans: 65 },
  ];
  const tY = 3.0;
  const tH = 0.92;
  const tGap = 0.18;
  tiers.forEach((t, i) => {
    const y = tY + i * (tH + tGap);
    // 폭 — 위계감 (TAM 100%, SAM 75%, SOM 50%)
    const widthRatio = [1.0, 0.78, 0.55][i];
    const tw = CW * widthRatio;
    s.addShape("rect", {
      x: MX, y, w: tw, h: tH,
      fill: { color: C.evergreen, transparency: t.trans },
      line: { color: C.evergreen, width: 0.75 },
    });
    s.addText(t.tag, {
      x: MX + 0.3, y, w: 1.2, h: tH,
      fontFace: F.sans, fontSize: 13, bold: true,
      color: C.evergreen, charSpacing: 8, valign: "middle", margin: 0,
    });
    s.addText(t.v, {
      x: MX + 1.55, y, w: 2.4, h: tH,
      fontFace: F.serif, fontSize: 32, bold: true,
      color: C.ink, valign: "middle", margin: 0,
    });
    s.addText(t.note, {
      x: MX + 4.0, y, w: tw - 4.3, h: tH,
      fontFace: F.sans, fontSize: 12,
      color: C.inkSoft, valign: "middle", margin: 0,
    });
  });

  // 하단 매출 추정 박스
  s.addText([
    { text: "1년차 매출 추정  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "1,500명 × 49,000원 ≈ ", options: { fontFace: F.sans, fontSize: 14, color: C.inkSoft } },
    { text: "7,350만원", options: { fontFace: F.serif, fontSize: 20, bold: true, color: C.evergreen } },
  ], {
    x: MX, y: 6.55, w: CW, h: 0.5, align: "center", valign: "middle", margin: 0,
  });

  footerNum(s, pageNo);
  s.addNotes(
    "시장 규모는 세 단계로 봅니다. " +
    "TAM 은 초등 임용 1차 연 응시자 4만 명, SAM 은 디지털 학습 결제 의향 37.5% 인 1.5만 명. " +
    "그중 SOM — 우리가 시즌 1 에 잡으려는 결제 회원은 1,500 명 입니다. " +
    "1,500 명 × 49,000 원 으로 1년차 매출은 약 7,350만원, 한 명이 운영하는 작은 팀의 PMF 검증 규모로 충분합니다."
  );
}

// ─────────── Slide 11 — PART 6 · BM (신규) ───────────
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  pageNo += 1;

  partLabel(s, "PART 6 · 비즈니스 모델");
  bigTitle(s, [
    { text: "Free + Pass ", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.ink } },
    { text: "49,000원", options: { fontFace: F.serif, fontSize: 52, bold: true, color: C.evergreen } },
  ], { y: 1.15, h: 1.2 });
  pageRule(s, 2.55);

  // 2 컬럼 비교
  const colW = (CW - 0.4) / 2;
  const colY = 3.0;
  const colH = 3.0;

  // 좌 — Free
  s.addShape("rect", {
    x: MX, y: colY, w: colW, h: colH,
    fill: { color: C.creamSoft },
    line: { color: C.ruleStrong, width: 0.5 },
  });
  s.addText("FREE", {
    x: MX + 0.4, y: colY + 0.3, w: colW - 0.8, h: 0.4,
    fontFace: F.sans, fontSize: 13, bold: true,
    color: C.inkMuted, charSpacing: 8, margin: 0,
  });
  s.addText("0원", {
    x: MX + 0.4, y: colY + 0.7, w: colW - 0.8, h: 0.7,
    fontFace: F.serif, fontSize: 36, bold: true,
    color: C.ink, margin: 0,
  });
  s.addText([
    { text: "·  풀이 트랙 ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "5장/일", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink, breakLine: true } },
    { text: "·  기출 분석 ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "전체", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink, breakLine: true } },
    { text: "·  키워드 노트 ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "30개", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink } },
  ], {
    x: MX + 0.4, y: colY + 1.5, w: colW - 0.8, h: colH - 1.7,
    valign: "top", margin: 0, paraSpaceAfter: 6,
  });

  // 우 — Pass (강조)
  const rx = MX + colW + 0.4;
  s.addShape("rect", {
    x: rx, y: colY, w: colW, h: colH,
    fill: { color: C.evergreen, transparency: 90 },
    line: { color: C.evergreen, width: 1.5 },
  });
  s.addText("PASS · 시즌권", {
    x: rx + 0.4, y: colY + 0.3, w: colW - 0.8, h: 0.4,
    fontFace: F.sans, fontSize: 13, bold: true,
    color: C.evergreen, charSpacing: 8, margin: 0,
  });
  s.addText([
    { text: "49,000", options: { fontFace: F.serif, fontSize: 44, bold: true, color: C.evergreen } },
    { text: "원", options: { fontFace: F.serif, fontSize: 22, color: C.evergreen } },
  ], {
    x: rx + 0.4, y: colY + 0.7, w: colW - 0.8, h: 0.8,
    valign: "middle", margin: 0,
  });
  s.addText([
    { text: "·  ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "무제한 풀이", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink, breakLine: true } },
    { text: "·  ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "AI 모범답안 + 자가 채점 이력", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink, breakLine: true } },
    { text: "·  ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "Gemini TTS 팟캐스트 전체", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink, breakLine: true } },
    { text: "·  ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "오답노트 PDF 인쇄", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink } },
  ], {
    x: rx + 0.4, y: colY + 1.5, w: colW - 0.8, h: colH - 1.7,
    valign: "top", margin: 0, paraSpaceAfter: 6,
  });

  // 하단 가격 근거
  s.addText([
    { text: "한계비용 ", options: { fontFace: F.sans, fontSize: 13, color: C.inkSoft } },
    { text: "≈ 0", options: { fontFace: F.serif, fontSize: 16, bold: true, color: C.evergreen } },
    { text: " — AI 채점·키워드 노트는 한 번 시드되면 사용자 N 배 증가에도 비용 미미.    ", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft } },
    { text: "박문각 인강 80~150만원의 5% 이하", options: { fontFace: F.sans, fontSize: 12, italic: true, bold: true, color: C.ink } },
  ], {
    x: MX, y: 6.3, w: CW, h: 0.7, align: "center", valign: "middle", margin: 0,
  });

  footerNum(s, pageNo);
  s.addNotes(
    "비즈니스 모델은 Free + Pass 단일 시즌권 구조입니다. " +
    "Free 는 풀이 5장 / 일, 기출 분석 전체, 키워드 30개 — 충분한 체험. " +
    "Pass 는 49,000원 — 박문각 인강 패스 80~150만원의 5% 이하 가격입니다. " +
    "이게 가능한 이유는 AI 가 채점하고 키워드 노트를 생성하기 때문에 한계비용이 거의 0 이기 때문입니다. " +
    "정직한 가격, 단일 가격, D-Day 차등 할인 없음 — 우리 디자인 철학과 정합합니다."
  );
}

// ─────────── Slide 12 — PART 6 · GTM + 12개월 로드맵 (신규) ───────────
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  pageNo += 1;

  partLabel(s, "PART 6 · GTM · 로드맵");
  bigTitle(s, [
    { text: "유튜버 + ", options: { fontFace: F.serif, fontSize: 46, bold: true, color: C.ink } },
    { text: "교대 커뮤니티 바이럴", options: { fontFace: F.serif, fontSize: 46, bold: true, color: C.evergreen } },
  ], { y: 1.15, h: 1.2, size: 46 });
  pageRule(s, 2.55);

  const halfW = (CW - 0.5) / 2;

  // 좌 — GTM 2 트랙
  s.addText("GTM 2 트랙", {
    x: MX, y: 3.0, w: halfW, h: 0.35,
    fontFace: F.sans, fontSize: 12, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
  // 단기
  s.addShape("rect", {
    x: MX, y: 3.45, w: halfW, h: 1.55,
    fill: { color: C.creamSoft },
    line: { color: C.ruleStrong, width: 0.5 },
  });
  s.addText([
    { text: "단기  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "유튜버 합작 + 커뮤니티 바이럴", options: { fontFace: F.sans, fontSize: 15, bold: true, color: C.ink, breakLine: true } },
    { text: " ", options: { fontSize: 5, breakLine: true } },
    { text: "임용 유튜버 5~10명 무료 Pass + 콘텐츠 합작 1편", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft, breakLine: true } },
    { text: "교대 ", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft } },
    { text: "에브리타임 · 초임공", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink } },
    { text: " 시드 후기 + 무료 체험", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft } },
  ], {
    x: MX + 0.3, y: 3.55, w: halfW - 0.6, h: 1.4,
    valign: "top", margin: 0, paraSpaceAfter: 3,
  });
  // 장기
  s.addShape("rect", {
    x: MX, y: 5.15, w: halfW, h: 1.4,
    fill: { color: C.creamSoft },
    line: { color: C.ruleStrong, width: 0.5 },
  });
  s.addText([
    { text: "장기  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "콘텐츠 SEO", options: { fontFace: F.sans, fontSize: 15, bold: true, color: C.ink, breakLine: true } },
    { text: " ", options: { fontSize: 5, breakLine: true } },
    { text: "24년치 데이터 자산 → 블로그 long-tail", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft, breakLine: true } },
    { text: "주 2편 · 50편 발행 시 검색 유입 안정", options: { fontFace: F.sans, fontSize: 12, color: C.inkSoft } },
  ], {
    x: MX + 0.3, y: 5.25, w: halfW - 0.6, h: 1.25,
    valign: "top", margin: 0, paraSpaceAfter: 3,
  });

  // 우 — 12개월 로드맵
  const rx = MX + halfW + 0.5;
  s.addText("12개월 로드맵", {
    x: rx, y: 3.0, w: halfW, h: 0.35,
    fontFace: F.sans, fontSize: 12, bold: true,
    color: C.evergreen, charSpacing: 6, margin: 0,
  });
  // 세로 타임라인
  const tlX = rx + 0.18;
  const tlY = 3.55;
  const tlH = 3.0;
  s.addShape("line", {
    x: tlX, y: tlY, w: 0, h: tlH,
    line: { color: C.evergreen, width: 1.25 },
  });
  const milestones = [
    { d: "2026-06", t: "시드 적재 + 유튜버 컨택" },
    { d: "2026-07", t: "클로즈드 베타 (50~100명)" },
    { d: "2026-08", t: "오픈 베타" },
    { d: "2026-09", t: "정식 출시 (Pass 활성)" },
    { d: "2026-12", t: "시즌 1 종료 + 후기 수집" },
    { d: "2027-03", t: "시즌 2 v2 정식 출시" },
  ];
  const mY = tlH / (milestones.length - 1);
  milestones.forEach((m, i) => {
    const my = tlY + i * mY;
    s.addShape("oval", {
      x: tlX - 0.09, y: my - 0.09, w: 0.18, h: 0.18,
      fill: { color: C.evergreen },
      line: { color: C.evergreen, width: 0 },
    });
    s.addText(m.d, {
      x: tlX + 0.25, y: my - 0.15, w: 1.1, h: 0.3,
      fontFace: F.sans, fontSize: 11, bold: true,
      color: C.evergreen, charSpacing: 2, valign: "middle", margin: 0,
    });
    s.addText(m.t, {
      x: tlX + 1.45, y: my - 0.15, w: halfW - 1.55, h: 0.3,
      fontFace: F.sans, fontSize: 13,
      color: C.ink, valign: "middle", margin: 0,
    });
  });

  // 하단 카피
  s.addText("이번 시즌 베타 검증 → 시즌 2 본 운영.", {
    x: MX, y: 6.85, w: CW, h: 0.35,
    fontFace: F.serif, fontSize: 14, italic: true, bold: true,
    color: C.evergreen, align: "center", margin: 0,
  });

  footerNum(s, pageNo);
  s.addNotes(
    "GTM 은 두 축입니다. 단기 — 임용 유튜버 5~10 명에게 무료 Pass 와 콘텐츠 합작, " +
    "그리고 교대생이 극도로 밀집한 에브리타임과 초임공 커뮤니티에 시드 후기와 무료 체험을 풉니다. " +
    "장기 — 24 년치 데이터를 SEO 블로그로 풀어 long-tail 검색 유입. " +
    "로드맵은 7월 클로즈드 베타, 9월 정식 출시, 12월 시즌 1 종료, 2027년 3월 시즌 2 v2."
  );
}

// ─────────── Slide 13 — PART 7 · 회고 (신규) ───────────
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  pageNo += 1;

  partLabel(s, "PART 7 · 회고");
  bigTitle(s, [
    { text: "AI 협업 14일 — ", options: { fontFace: F.serif, fontSize: 46, bold: true, color: C.ink } },
    { text: "규율과 정직", options: { fontFace: F.serif, fontSize: 46, bold: true, color: C.evergreen } },
    { text: ".", options: { fontFace: F.serif, fontSize: 46, bold: true, color: C.ink } },
  ], { y: 1.15, h: 1.2, size: 46 });
  pageRule(s, 2.55);

  // 상단 통계
  s.addText([
    { text: "225 ", options: { fontFace: F.serif, fontSize: 32, bold: true, color: C.evergreen } },
    { text: "commits   ·   ", options: { fontFace: F.sans, fontSize: 14, color: C.inkMuted } },
    { text: "56 ", options: { fontFace: F.serif, fontSize: 32, bold: true, color: C.evergreen } },
    { text: "PR   ·   ", options: { fontFace: F.sans, fontSize: 14, color: C.inkMuted } },
    { text: "6 ", options: { fontFace: F.serif, fontSize: 32, bold: true, color: C.evergreen } },
    { text: "단계 PR 시리즈", options: { fontFace: F.sans, fontSize: 14, color: C.inkMuted } },
  ], {
    x: MX, y: 2.85, w: CW, h: 0.7, align: "center", valign: "middle", margin: 0,
  });

  // 2 박스 가로 분할
  const colW = (CW - 0.4) / 2;
  const colY = 3.8;
  const colH = 2.6;

  // 좌 — 규율 (헌법)
  s.addShape("rect", {
    x: MX, y: colY, w: colW, h: colH,
    fill: { color: C.creamSoft },
    line: { color: C.evergreen, width: 1 },
  });
  s.addShape("line", {
    x: MX, y: colY, w: 0, h: colH,
    line: { color: C.evergreen, width: 3 },
  });
  s.addText("규율 — 헌법 시스템으로 AI 통제", {
    x: MX + 0.3, y: colY + 0.18, w: colW - 0.5, h: 0.35,
    fontFace: F.sans, fontSize: 13, bold: true,
    color: C.evergreen, charSpacing: 3, margin: 0,
  });
  s.addText([
    { text: "종전  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "단일 ", options: { fontFace: F.sans, fontSize: 12, color: C.ink } },
    { text: "CLAUDE.md ", options: { fontFace: F.sans, fontSize: 12, italic: true, color: C.ink } },
    { text: "지침서 → AI가 자주 말을 안 듣고 스코프 폭주", options: { fontFace: F.sans, fontSize: 12, color: C.ink, breakLine: true } },
    { text: "전환  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "4 계층 위계 (한국 법체계 정합)", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "        헌법 / 법률 / 시행령 / 시행규칙", options: { fontFace: F.sans, fontSize: 11, italic: true, color: C.inkSoft, breakLine: true } },
    { text: "결과  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "모든 결정 → 헌법 조항 ", options: { fontFace: F.sans, fontSize: 12, color: C.ink } },
    { text: "근거 명시 의무", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "        신규 기능 자가 추가 금지 (스코프 보호)", options: { fontFace: F.sans, fontSize: 11, italic: true, color: C.inkSoft } },
  ], {
    x: MX + 0.3, y: colY + 0.6, w: colW - 0.5, h: colH - 0.75,
    valign: "top", margin: 0, paraSpaceAfter: 4,
  });

  // 우 — 정직 (silent fallback)
  const rx2 = MX + colW + 0.4;
  s.addShape("rect", {
    x: rx2, y: colY, w: colW, h: colH,
    fill: { color: C.creamSoft },
    line: { color: C.evergreen, width: 1 },
  });
  s.addShape("line", {
    x: rx2, y: colY, w: 0, h: colH,
    line: { color: C.evergreen, width: 3 },
  });
  s.addText("정직 — silent fallback 회귀 (PR #71)", {
    x: rx2 + 0.3, y: colY + 0.18, w: colW - 0.5, h: 0.35,
    fontFace: F.sans, fontSize: 13, bold: true,
    color: C.evergreen, charSpacing: 3, margin: 0,
  });
  s.addText([
    { text: "증상  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "채점 후 AI 총평·키워드·diff 모두 빈 화면", options: { fontFace: F.sans, fontSize: 12, color: C.ink, breakLine: true } },
    { text: "원인  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "LLM JSON 파싱 실패 시 ", options: { fontFace: F.sans, fontSize: 12, color: C.ink } },
    { text: "조용히 빈 배열 fallback", options: { fontFace: F.sans, fontSize: 12, italic: true, bold: true, color: C.ink, breakLine: true } },
    { text: "        → UI 가 “성공인데 빈 답안” 으로 오안내", options: { fontFace: F.sans, fontSize: 11, italic: true, color: C.inkSoft, breakLine: true } },
    { text: "해결  ", options: { fontFace: F.sans, fontSize: 11, bold: true, color: C.inkMuted, charSpacing: 4 } },
    { text: "명시 throw + 진단 로그", options: { fontFace: F.sans, fontSize: 12, bold: true, color: C.ink, breakLine: true } },
    { text: "        + 출력 토큰 2048 → 4096 격상", options: { fontFace: F.sans, fontSize: 11, italic: true, color: C.inkSoft } },
  ], {
    x: rx2 + 0.3, y: colY + 0.6, w: colW - 0.5, h: colH - 0.75,
    valign: "top", margin: 0, paraSpaceAfter: 4,
  });

  // 하단 배움
  s.addText("“헌법으로 통제, fallback 은 명시 에러로 surface.”", {
    x: MX, y: 6.65, w: CW, h: 0.45,
    fontFace: F.serif, fontSize: 17, italic: true, bold: true,
    color: C.evergreen, align: "center", margin: 0,
  });

  footerNum(s, pageNo);
  s.addNotes(
    "마지막으로 14일 AI 협업 회고입니다. 225 commits, 56 PR — 두 가지 교훈으로 정리됩니다. " +
    "첫째 규율 — 처음에는 단일 CLAUDE.md 지침서로 AI 에게 명령했지만, AI 가 자주 말을 안 듣고 스코프가 폭주했습니다. " +
    "그래서 한국 법체계처럼 4 계층 위계 — 헌법, 법률, 시행령, 시행규칙 — 으로 분리하고, " +
    "모든 결정에 헌법 조항 근거 명시를 의무화했습니다. 이후 AI 가 임의로 신규 기능을 추가하는 일이 사라졌습니다. " +
    "둘째 정직 — AI 분석 결과가 빈 화면으로 표시되는 회귀가 있었습니다. " +
    "LLM JSON 파싱이 실패하면 코드가 조용히 빈 배열로 fallback 하고 있었습니다. " +
    "여기서 배운 원칙은, fallback 은 명시 에러로 surface 해야 한다, silent 는 사용자에게 정직하지 않다. " +
    "감사합니다."
  );
}

// ─────────── Slide 14 — 마지막 컷 (신규) ───────────
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  pageNo += 1;

  // 중앙 정렬 클로징
  s.addText("Fitly", {
    x: MX, y: 1.8, w: CW, h: 1.6,
    fontFace: F.serif, fontSize: 120, bold: true,
    color: C.ink, align: "center", valign: "middle", margin: 0,
  });
  s.addText("합격은 시간이 아니라 적합도다.", {
    x: MX, y: 3.4, w: CW, h: 0.7,
    fontFace: F.serif, fontSize: 28, italic: true,
    color: C.evergreen, align: "center", valign: "middle", margin: 0,
  });

  // 가로 rule
  s.addShape("line", {
    x: MX + CW / 2 - 1.5, y: 4.5, w: 3, h: 0,
    line: { color: C.ruleStrong, width: 1 },
  });

  // 베타 모집
  s.addText([
    { text: "2026년 7월", options: { fontFace: F.sans, fontSize: 17, bold: true, color: C.evergreen, charSpacing: 4 } },
    { text: "    클로즈드 베타 모집 예정", options: { fontFace: F.sans, fontSize: 17, color: C.inkSoft } },
  ], {
    x: MX, y: 4.85, w: CW, h: 0.5, align: "center", valign: "middle", margin: 0,
  });

  // 팀
  s.addText([
    { text: "팀 ", options: { fontFace: F.sans, fontSize: 13, color: C.inkMuted } },
    { text: "편돌이들", options: { fontFace: F.sans, fontSize: 13, bold: true, color: C.ink } },
    { text: "    ·    이정주 · 백승환 · 오세울 · 문규승", options: { fontFace: F.sans, fontSize: 12, color: C.inkMuted } },
  ], {
    x: MX, y: 5.6, w: CW, h: 0.4, align: "center", valign: "middle", margin: 0,
  });

  s.addText("감사합니다.", {
    x: MX, y: 6.5, w: CW, h: 0.4,
    fontFace: F.serif, fontSize: 16, italic: true,
    color: C.inkMuted, align: "center", margin: 0,
  });

  s.addNotes(
    "Fitly. 합격은 시간이 아니라 적합도다. " +
    "2026년 7월 클로즈드 베타 모집 예정. " +
    "편돌이들 팀, 이정주·백승환·오세울·문규승. 감사합니다."
  );
}

// ─────────── 출력 ───────────
pres.writeFile({ fileName: "발표.pptx" })
  .then((name) => console.log(`✓ 생성 완료: ${name} (총 ${pageNo} 슬라이드)`))
  .catch((e) => { console.error("✗ 실패:", e); process.exit(1); });
