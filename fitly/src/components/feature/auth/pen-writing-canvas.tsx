"use client";

// three.js scene — 가로 괘선 노트 + 정교한 만년필 mesh + 펀치라인 두 줄 밑줄.
//
// 펀치라인 텍스트는 HTML overlay (CSS clip-path reveal)로 처리하고,
// three.js scene은 *공간 구성*(종이 isometric + 만년필 mesh + 밑줄 잉크
// 셰이더)만 담당한다. 한국어 폰트를 three.js에 로드하는 비용을 회피한다.
//
// 만년필이 펀치라인 두 줄 *아래에* 부드러운 evergreen 밑줄을 그어 *강조한다*.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const WRITE_DURATION_MS = 2400;
const WRITE_DELAY_MS = 400;

export function PenWritingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "writing" | "done">("idle");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (container.clientWidth === 0 || container.clientHeight === 0) {
      const raf = requestAnimationFrame(() => {
        setRetryToken((t) => t + 1);
      });
      return () => cancelAnimationFrame(raf);
    }

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
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    // ── 색 ──────────────────────────────────────────────────────────────
    const inkColor = new THREE.Color(0x1f5c4a); // --color-accent (evergreen)
    const inkInk = new THREE.Color(0x173f33); // --color-accent-strong
    const penBodyDark = new THREE.Color(0x111418); // 더 진한 검정
    const penBodyMid = new THREE.Color(0x2a2f37); // 중간 톤 — 입체감
    const penAccent = new THREE.Color(0xc9a96a); // 골드 클립·링 (펜의 정교함)

    // ── 만년필 mesh — 정교화 ─────────────────────────────────────────────
    // 비율: 총 길이 3.4, body 2.2, cap 1.0, nib 0.3
    const penGroup = new THREE.Group();

    // Lower body (닙쪽 — 약간 더 슬림)
    const lowerBodyGeo = new THREE.CylinderGeometry(0.075, 0.085, 1.0, 32);
    const lowerBodyMat = new THREE.MeshBasicMaterial({ color: penBodyDark });
    const lowerBody = new THREE.Mesh(lowerBodyGeo, lowerBodyMat);
    lowerBody.position.y = 0.5;
    penGroup.add(lowerBody);

    // Grip ring (golden) — body와 cap 사이 데코
    const gripRingGeo = new THREE.TorusGeometry(0.092, 0.02, 12, 32);
    const gripRingMat = new THREE.MeshBasicMaterial({ color: penAccent });
    const gripRing = new THREE.Mesh(gripRingGeo, gripRingMat);
    gripRing.position.y = 1.05;
    gripRing.rotation.x = Math.PI / 2;
    penGroup.add(gripRing);

    // Upper body (cap 직전 — 살짝 두껍게)
    const upperBodyGeo = new THREE.CylinderGeometry(0.092, 0.075, 1.2, 32);
    const upperBodyMat = new THREE.MeshBasicMaterial({ color: penBodyMid });
    const upperBody = new THREE.Mesh(upperBodyGeo, upperBodyMat);
    upperBody.position.y = 1.65;
    penGroup.add(upperBody);

    // Cap separator ring
    const capRingGeo = new THREE.TorusGeometry(0.094, 0.018, 12, 32);
    const capRingMat = new THREE.MeshBasicMaterial({ color: penAccent });
    const capRing = new THREE.Mesh(capRingGeo, capRingMat);
    capRing.position.y = 2.25;
    capRing.rotation.x = Math.PI / 2;
    penGroup.add(capRing);

    // Cap (body)
    const capGeo = new THREE.CylinderGeometry(0.094, 0.094, 0.95, 32);
    const capMat = new THREE.MeshBasicMaterial({ color: penBodyDark });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 2.78;
    penGroup.add(cap);

    // Cap top (살짝 둥근 끝)
    const capTopGeo = new THREE.SphereGeometry(0.094, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const capTopMat = new THREE.MeshBasicMaterial({ color: penBodyDark });
    const capTop = new THREE.Mesh(capTopGeo, capTopMat);
    capTop.position.y = 3.255;
    penGroup.add(capTop);

    // Pocket clip (golden, BoxGeometry)
    const clipGeo = new THREE.BoxGeometry(0.018, 0.6, 0.045);
    const clipMat = new THREE.MeshBasicMaterial({ color: penAccent });
    const clip = new THREE.Mesh(clipGeo, clipMat);
    clip.position.set(0.105, 2.85, 0);
    penGroup.add(clip);
    // Clip 끝 dot
    const clipDotGeo = new THREE.SphereGeometry(0.025, 16, 16);
    const clipDotMat = new THREE.MeshBasicMaterial({ color: penAccent });
    const clipDot = new THREE.Mesh(clipDotGeo, clipDotMat);
    clipDot.position.set(0.105, 2.55, 0);
    penGroup.add(clipDot);

    // Nib (cone) — golden gradient 느낌으로 두 segment
    const nibUpperGeo = new THREE.CylinderGeometry(0.075, 0.045, 0.18, 24);
    const nibUpperMat = new THREE.MeshBasicMaterial({ color: penAccent });
    const nibUpper = new THREE.Mesh(nibUpperGeo, nibUpperMat);
    nibUpper.position.y = -0.09;
    penGroup.add(nibUpper);

    const nibTipGeo = new THREE.ConeGeometry(0.045, 0.16, 24);
    const nibTipMat = new THREE.MeshBasicMaterial({ color: penAccent });
    const nibTip = new THREE.Mesh(nibTipGeo, nibTipMat);
    nibTip.position.y = -0.26;
    nibTip.rotation.x = Math.PI; // 끝이 아래
    penGroup.add(nibTip);

    // Nib slit (가운데 검은 선)
    const slitGeo = new THREE.BoxGeometry(0.005, 0.18, 0.05);
    const slitMat = new THREE.MeshBasicMaterial({ color: penBodyDark });
    const slit = new THREE.Mesh(slitGeo, slitMat);
    slit.position.y = -0.18;
    penGroup.add(slit);

    // 만년필을 펀치라인 옆에 배치 — 글쓰기 시작 위치(좌측)
    const penStartX = -3.8;
    const penY = -1.0;
    penGroup.position.set(penStartX, penY, 0.5);
    // 글쓰기 자세 — 약 40도 기울어진 상태
    penGroup.rotation.z = -0.55;
    scene.add(penGroup);

    // ── 글쓰기 trail (evergreen 밑줄) ─────────────────────────────────────
    // 두 줄 펀치라인 *아래*에 부드러운 밑줄. zigzag 가로지르기 X.
    // 손글씨 밑줄 느낌으로 살짝 떨림 (sin wave 0.03 amplitude).
    const trailMat = new THREE.LineBasicMaterial({
      color: inkColor,
      transparent: true,
      opacity: 0.9,
    });
    const trailGeo = new THREE.BufferGeometry();
    const maxTrailPoints = 220;
    const trailPositions = new Float32Array(maxTrailPoints * 3);
    trailGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(trailPositions, 3),
    );
    trailGeo.setDrawRange(0, 0);
    const trail = new THREE.Line(trailGeo, trailMat);
    scene.add(trail);

    // 두 번째 trail (조금 더 진한 톤 — 잉크 두께감)
    const trailMat2 = new THREE.LineBasicMaterial({
      color: inkInk,
      transparent: true,
      opacity: 0.4,
    });
    const trailGeo2 = new THREE.BufferGeometry();
    const trailPositions2 = new Float32Array(maxTrailPoints * 3);
    trailGeo2.setAttribute(
      "position",
      new THREE.BufferAttribute(trailPositions2, 3),
    );
    trailGeo2.setDrawRange(0, 0);
    const trail2 = new THREE.Line(trailGeo2, trailMat2);
    scene.add(trail2);

    // 밑줄 path — 두 줄 펀치라인 각각 아래에 한 줄씩
    // (펀치라인은 HTML overlay에 있고 그 좌표를 추정 — 카메라 frustum 기준)
    const trailPath: { x: number; y: number }[] = [];
    const lineY1 = 0.4; // 첫 줄 펀치라인 ("임용은 열심히...") 아래
    const lineY2 = -0.6; // 두 번째 줄 ("맞게(Fit) 하는...") 아래
    const startX = -3.5;
    const endX = 3.5;
    const segments = 100;

    // 첫 줄 밑줄 (좌→우)
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const x = startX + (endX - startX) * t;
      // 손글씨 떨림 — sin + 살짝 우상향
      const y = lineY1 + Math.sin(t * 7) * 0.025 + t * 0.03;
      trailPath.push({ x, y });
    }
    // 두 줄 사이 살짝 떨어짐 (lift X — 끊김 표현)
    // 두 번째 줄 밑줄 (좌→우)
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const x = startX + (endX - startX) * t;
      const y = lineY2 + Math.sin(t * 7 + 1) * 0.025 + t * 0.02;
      trailPath.push({ x, y });
    }

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

    setTimeout(() => {
      writeStart = performance.now();
      setPhase("writing");
    }, WRITE_DELAY_MS);

    function animate() {
      const now = performance.now();

      if (writeStart > 0 && !writeDone) {
        const elapsed = now - writeStart;
        const progress = Math.min(1, elapsed / WRITE_DURATION_MS);
        const eased = 1 - Math.pow(1 - progress, 3);
        const pointCount = Math.floor(eased * trailPath.length);

        for (let i = 0; i < pointCount; i += 1) {
          const p = trailPath[i];
          trailPositions[i * 3] = p.x;
          trailPositions[i * 3 + 1] = p.y;
          trailPositions[i * 3 + 2] = 0.02;
          trailPositions2[i * 3] = p.x;
          trailPositions2[i * 3 + 1] = p.y - 0.012;
          trailPositions2[i * 3 + 2] = 0.015;
        }
        trailGeo.setDrawRange(0, pointCount);
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo2.setDrawRange(0, pointCount);
        trailGeo2.attributes.position.needsUpdate = true;

        if (pointCount > 0) {
          const tipPoint = trailPath[Math.min(pointCount - 1, trailPath.length - 1)];
          // 만년필 닙(끝)이 trail 끝점에 닿도록 — 펜의 끝 좌표를 보정
          // 펜이 -0.55 rad 기울어져 있으므로 nib offset 보정
          penGroup.position.x = tipPoint.x + 0.18;
          penGroup.position.y = tipPoint.y + 1.05;
        }

        if (progress >= 1) {
          writeDone = true;
          parallaxActive = true;
          setPhase("done");
        }
      }

      if (parallaxActive) {
        const lastPoint = trailPath[trailPath.length - 1];
        const targetX = lastPoint.x + 0.4 + mouseNorm.x * 0.06;
        const targetY = lastPoint.y + 1.05 + mouseNorm.y * 0.04;
        penGroup.position.x += (targetX - penGroup.position.x) * 0.05;
        penGroup.position.y += (targetY - penGroup.position.y) * 0.05;
        // 미세 회전 (잡고 있는 손의 떨림 느낌)
        const targetRot = -0.55 + mouseNorm.x * 0.025;
        penGroup.rotation.z += (targetRot - penGroup.rotation.z) * 0.05;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }

    let frameId = requestAnimationFrame(animate);

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

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      // dispose all geometries + materials
      penGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
      trailGeo.dispose();
      trailMat.dispose();
      trailGeo2.dispose();
      trailMat2.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [retryToken]);

  return (
    <div ref={containerRef} className="absolute inset-0">
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
