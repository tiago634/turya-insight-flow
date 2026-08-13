import { useEffect, useRef } from "react";

type Particle = {
  bx: number;
  by: number;
  ph: number;
  sp: number;
  amp: number;
  warm: number;
  w: number[];
  tw: number;
};

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stage = canvas.parentElement;
    if (!stage) return;
    stageRef.current = stage;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let cx = 0;
    let cy = 0;
    const cold = [108, 126, 156];
    const warms = [
      [234, 100, 36],
      [255, 222, 89],
      [255, 158, 61],
      [255, 198, 164],
    ];
    const N = 300;
    const ps: Particle[] = [];
    const ptr = { x: 0, y: 0, active: false };
    let touched = 0;
    let inter = false;
    const t0 = performance.now();
    let raf = 0;

    function seed() {
      ps.length = 0;
      for (let i = 0; i < N; i++) {
        ps.push({
          bx: Math.random() * W,
          by: Math.random() * H,
          ph: Math.random() * 6.28,
          sp: 0.4 + Math.random() * 0.8,
          amp: 3 + Math.random() * 7,
          warm: 0,
          w: warms[(Math.random() * warms.length) | 0],
          tw: Math.random() * 6.28,
        });
      }
    }

    function rs() {
      const pw = W;
      W = stage.clientWidth;
      H = stage.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2;
      cy = H * 0.42;
      if (W > 0 && (pw === 0 || ps.length === 0)) seed();
    }

    function mix(a: number[], b: number[], t: number) {
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }

    const R = 150;

    function draw(t: number) {
      ctx.clearRect(0, 0, W, H);
      const floor = Math.min(0.26, touched * 0.04);
      ctx.globalCompositeOperation = "lighter";
      for (let j = 0; j < N; j++) {
        const q = ps[j];
        const x = q.bx + Math.sin(t * q.sp + q.ph) * q.amp;
        const y = q.by + Math.cos(t * q.sp * 0.8 + q.ph) * q.amp;
        let prox = 0;
        if (ptr.active) {
          const dx = x - ptr.x;
          const dy = y - ptr.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < R) prox = 1 - d / R;
        }
        const tg = Math.max(prox * prox, floor);
        q.warm += (tg - q.warm) * 0.1;
        if (prox > 0.55) touched += 0.004;
        const tk = 0.55 + 0.45 * Math.sin(t * 1.3 + q.tw);
        const c = mix(cold, q.w, q.warm);
        const a = (0.16 + q.warm * 0.6) * tk;
        ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.1 + q.warm * 1.6, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      ptr.active = true;
      if (!inter) {
        inter = true;
        const h = document.getElementById("hero-hint");
        if (h) h.style.opacity = "0";
      }
    };
    const onLeave = () => {
      ptr.active = false;
    };

    rs();
    window.addEventListener("resize", rs);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);

    if (reduced) {
      ptr.active = true;
      ptr.x = cx;
      ptr.y = cy;
      touched = 4;
      draw(0);
    } else {
      const loop = (now: number) => {
        const t = ((now || performance.now()) - t0) / 1000;
        if (!inter) {
          ptr.active = true;
          ptr.x = cx + Math.sin(t * 0.55) * W * 0.26;
          ptr.y = cy + Math.sin(t * 0.85 + 1) * H * 0.2;
        }
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("resize", rs);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1] h-full w-full" aria-hidden />;
}
