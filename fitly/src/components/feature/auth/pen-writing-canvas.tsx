"use client";

// three.js scene — 가로 괘선 노트 + 미니멀 라인 만년필 + 글쓰기 trail.
// dynamic import 로만 로드 (SSR X). bundle은 (auth) 청크에만 포함.
//
// 펀치라인 텍스트는 HTML overlay (CSS clip-path reveal)로 처리하고,
// three.js scene은 *공간 구성*(종이 isometric + 만년필 mesh + 잉크 trail
// 셰이더)만 담당한다. 한국어 폰트를 three.js에 로드하는 비용을 회피한다.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// 글쓰기 모션 timing — 펀치라인 한 글자당 약 90ms × 28자 = ~2.5s.
const WRITE_DURATION_MS = 2600;
const WRITE_DELAY_MS = 400; // 페이지 마운트 후 짧은 호흡

export function PenWritingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "writing" | "done">("idle");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── three.js scene 초기화 ───────────────────────────────────────────
    const scene = new THREE.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    const frustumSize = 10;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100,
    );
    // Side-isometric — 종이 평면을 12~15도 기울인 시점.
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── 종이 평면 (cream + 미세한 종이 결) ───────────────────────────────
    // CSS variable에서 색 읽어 three.js color 동기화.
    const styles = getComputedStyle(document.documentElement);
    const cream = new THREE.Color().setHSL(
      parseInt(styles.getPropertyValue("--color-bg")) / 360 || 0.1,
      0.56,
      0.96,
    );
    const ruleColor = new THREE.Color(0xe8e2d5); // --color-rule
    const inkColor = new THREE.Color(0x1f5c4a); // --color-accent (evergreen)
    const penBodyColor = new THREE.Color(0x1a2027); // --color-text (deep ink)

    const paperGeo = new THREE.PlaneGeometry(frustumSize * aspect, frustumSize);
    const paperMat = new THREE.MeshBasicMaterial({ color: cream });
    const paper = new THREE.Mesh(paperGeo, paperMat);
    // 살짝 기울임 (12~15도 isometric 시점)
    paper.rotation.x = -0.22;
    paper.position.z = 0;
    scene.add(paper);

    // ── 가로 괘선 ────────────────────────────────────────────────────────
    const ruleGroup = new THREE.Group();
    const lineSpacing = 0.6;
    const lineCount = Math.ceil(frustumSize / lineSpacing);
    for (let i = 0; i < lineCount; i += 1) {
      const y = frustumSize / 2 - i * lineSpacing - 0.3;
      const ruleGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3((-frustumSize * aspect) / 2 + 0.5, y, 0.01),
        new THREE.Vector3((frustumSize * aspect) / 2 - 0.5, y, 0.01),
      ]);
      const ruleMat = new THREE.LineBasicMaterial({
        color: ruleColor,
        transparent: true,
        opacity: 0.7,
      });
      const line = new THREE.Line(ruleGeo, ruleMat);
      ruleGroup.add(line);
    }
    ruleGroup.rotation.x = -0.22;
    scene.add(ruleGroup);

    // ── 만년필 mesh — low-poly 검은 라인 실루엣 ───────────────────────────
    const penGroup = new THREE.Group();
    // body cylinder
    const bodyGeo = new THREE.CylinderGeometry(0.08, 0.06, 2.4, 16);
    const bodyMat = new THREE.MeshBasicMaterial({ color: penBodyColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    penGroup.add(body);
    // tip cone (닙)
    const tipGeo = new THREE.ConeGeometry(0.06, 0.32, 12);
    const tipMat = new THREE.MeshBasicMaterial({ color: penBodyColor });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = -0.16;
    tip.rotation.x = Math.PI; // 끝이 아래
    penGroup.add(tip);
    // 캡 분리 라인 (미세 디테일)
    const capGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.04, 16);
    const capMat = new THREE.MeshBasicMaterial({ color: 0x6b6256 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.6;
    penGroup.add(cap);

    // 만년필을 펀치라인 시작점에 배치 (글쓰기 시작 위치)
    // 좌측에서 시작, 살짝 기울어진 자세
    const penStartX = -3.5;
    const penY = -1.0;
    penGroup.position.set(penStartX, penY, 0.5);
    penGroup.rotation.z = -0.4; // 30도 정도 기울임 (글쓰기 자세)
    penGroup.rotation.x = -0.22; // 종이 isometric 정합
    scene.add(penGroup);

    // ── 글쓰기 trail (evergreen 잉크 라인) ────────────────────────────────
    const trailMat = new THREE.LineBasicMaterial({
      color: inkColor,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const trailGeo = new THREE.BufferGeometry();
    const maxTrailPoints = 200;
    const trailPositions = new Float32Array(maxTrailPoints * 3);
    trailGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(trailPositions, 3),
    );
    trailGeo.setDrawRange(0, 0);
    const trail = new THREE.Line(trailGeo, trailMat);
    trail.rotation.x = -0.22;
    scene.add(trail);

    // ── 마우스 parallax state ───────────────────────────────────────────
    const mouseNorm = { x: 0, y: 0 };
    let parallaxActive = false;

    function handleMouseMove(e: MouseEvent) {
      const rect = container?.getBoundingClientRect();
      if (!rect) return;
      mouseNorm.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseNorm.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    container.addEventListener("mousemove", handleMouseMove);

    // ── 글쓰기 애니메이션 ─────────────────────────────────────────────────
    let writeStart = 0;
    let writeDone = false;

    // 글쓰기 trail이 그려질 경로 (단순 zigzag — 펀치라인 두 줄 시뮬레이션)
    const trailPath: { x: number; y: number }[] = [];
    const writePathStartX = -3.2;
    const writePathEndX = 3.2;
    const writePathLineY1 = -0.8;
    const writePathLineY2 = -1.6;
    // 첫 줄: "임용은 열심히 하는 게 아니라,"
    for (let i = 0; i <= 50; i += 1) {
      trailPath.push({
        x: writePathStartX + (writePathEndX - writePathStartX) * (i / 50),
        y: writePathLineY1 + Math.sin(i * 0.4) * 0.04, // 살짝 떨림
      });
    }
    // 두 줄째: "맞게(Fit) 하는 게임입니다."
    for (let i = 0; i <= 50; i += 1) {
      trailPath.push({
        x: writePathStartX + (writePathEndX - writePathStartX) * (i / 50),
        y: writePathLineY2 + Math.sin(i * 0.4) * 0.04,
      });
    }

    setTimeout(() => {
      writeStart = performance.now();
      setPhase("writing");
    }, WRITE_DELAY_MS);

    function animate() {
      const now = performance.now();

      // 글쓰기 진행
      if (writeStart > 0 && !writeDone) {
        const elapsed = now - writeStart;
        const progress = Math.min(1, elapsed / WRITE_DURATION_MS);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const pointCount = Math.floor(eased * trailPath.length);

        // trail 점 업데이트
        for (let i = 0; i < pointCount; i += 1) {
          const p = trailPath[i];
          trailPositions[i * 3] = p.x;
          trailPositions[i * 3 + 1] = p.y;
          trailPositions[i * 3 + 2] = 0.02;
        }
        trailGeo.setDrawRange(0, pointCount);
        trailGeo.attributes.position.needsUpdate = true;

        // 만년필 위치 — trail 끝 지점 따라가기
        if (pointCount > 0) {
          const tipPoint = trailPath[Math.min(pointCount - 1, trailPath.length - 1)];
          // 만년필 끝(닙)이 trail 끝점에 닿도록 보정
          penGroup.position.x = tipPoint.x + 0.3;
          penGroup.position.y = tipPoint.y + 0.9;
        }

        if (progress >= 1) {
          writeDone = true;
          parallaxActive = true;
          setPhase("done");
        }
      }

      // 글쓰기 완료 후 마우스 parallax
      if (parallaxActive) {
        // 마지막 trail 끝점 + 마우스 미세 흔들림
        const lastPoint = trailPath[trailPath.length - 1];
        const targetX = lastPoint.x + 0.3 + mouseNorm.x * 0.08;
        const targetY = lastPoint.y + 0.9 + mouseNorm.y * 0.06;
        // ease 보간
        penGroup.position.x += (targetX - penGroup.position.x) * 0.06;
        penGroup.position.y += (targetY - penGroup.position.y) * 0.06;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }

    let frameId = requestAnimationFrame(animate);

    // ── resize handler ──────────────────────────────────────────────────
    function handleResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const a = w / h;
      camera.left = (-frustumSize * a) / 2;
      camera.right = (frustumSize * a) / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // ── cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      paperGeo.dispose();
      paperMat.dispose();
      bodyGeo.dispose();
      bodyMat.dispose();
      tipGeo.dispose();
      tipMat.dispose();
      capGeo.dispose();
      capMat.dispose();
      trailGeo.dispose();
      trailMat.dispose();
      ruleGroup.children.forEach((line) => {
        if (line instanceof THREE.Line) {
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {/* 펀치라인 HTML overlay — three.js scene 위에 겹쳐 노출.
          three.js scene이 *글쓰기 trail*을 그리는 동안 텍스트는 fade-in.
          접근성: 스크린 리더가 텍스트를 읽을 수 있다 (scene은 aria-hidden). */}
      <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none px-8">
        <div className="max-w-md">
          <p
            className={`font-serif text-2xl md:text-3xl lg:text-[2.2rem] leading-[1.4] tracking-tight text-foreground/90 transition-opacity duration-700 ${
              phase === "idle" ? "opacity-0" : "opacity-100"
            }`}
          >
            임용은 열심히 하는 게 아니라,
            <br />
            <em className="not-italic font-semibold text-evergreen">
              맞게(Fit)
            </em>{" "}
            하는 게임입니다.
          </p>
          <p
            className={`mt-6 text-[12px] uppercase tracking-[0.18em] text-muted-foreground transition-opacity duration-700 delay-500 ${
              phase === "done" ? "opacity-100" : "opacity-0"
            }`}
          >
            Fitly — 초등 임용 1차 학습 플래너
          </p>
        </div>
      </div>
    </div>
  );
}

export default PenWritingCanvas;
