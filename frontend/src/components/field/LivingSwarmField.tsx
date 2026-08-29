import { useEffect, useRef } from "react";

export interface SwarmAnchor {
  id: string;
  x: number; // px, relative to the field's container
  y: number; // px, relative to the field's container
  /** 0 = dormant, 1 = fully converged/glowing (e.g. "done") */
  energy: number;
  /** orbit tightness driver: higher = tighter, faster orbit */
  intensity: number;
  color: "stone" | "violet" | "gold" | "breaks";
}

interface LivingSwarmFieldProps {
  anchors: SwarmAnchor[];
  /** When false, particles ignore anchors and drift freely (ambient/idle mode). */
  active?: boolean;
  particleCount?: number;
  className?: string;
}

type Particle = {
  anchorIndex: number | null;
  angle: number;
  angularSpeed: number;
  radius: number;
  targetRadius: number;
  ellipse: number;
  fx: number;
  fy: number;
  fvx: number;
  fvy: number;
  size: number;
  phase: number;
  phaseSpeed: number;
  jitterX: number;
  jitterY: number;
};

const COLOR_VARS: Record<SwarmAnchor["color"], string> = {
  stone: "--color-stone-dim",
  violet: "--color-violet",
  gold: "--color-gold",
  breaks: "--color-breaks",
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full || "888888", 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function LivingSwarmField({
  anchors,
  active = false,
  particleCount = 140,
  className = "",
}: LivingSwarmFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const anchorsRef = useRef<SwarmAnchor[]>(anchors);
  const activeRef = useRef(active);
  const sizeRef = useRef({ w: 0, h: 0 });
  const paletteRef = useRef<Record<SwarmAnchor["color"], [number, number, number]>>({
    stone: [92, 86, 76],
    violet: [139, 123, 216],
    gold: [217, 164, 65],
    breaks: [224, 101, 79],
  });

  useEffect(() => {
    anchorsRef.current = anchors;
  }, [anchors]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Resolve theme colors from CSS variables once on mount.
  useEffect(() => {
    if (!canvasRef.current) return;
    const styles = getComputedStyle(canvasRef.current);
    const next = { ...paletteRef.current };
    (Object.keys(COLOR_VARS) as SwarmAnchor["color"][]).forEach((key) => {
      const raw = styles.getPropertyValue(COLOR_VARS[key]).trim();
      if (raw && raw.startsWith("#")) next[key] = hexToRgb(raw);
    });
    paletteRef.current = next;
  }, []);

  // Initialize particle pool once.
  useEffect(() => {
    const seedRand = (() => {
      let seed = 1337;
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    })();

    particlesRef.current = Array.from({ length: particleCount }, () => ({
      anchorIndex: null,
      angle: seedRand() * Math.PI * 2,
      angularSpeed: 0.15 + seedRand() * 0.25,
      radius: 40 + seedRand() * 60,
      targetRadius: 40 + seedRand() * 60,
      ellipse: 0.45 + seedRand() * 0.25,
      fx: seedRand(),
      fy: seedRand(),
      fvx: (seedRand() - 0.5) * 0.06,
      fvy: (seedRand() - 0.5) * 0.06,
      size: 0.7 + seedRand() * 1.6,
      phase: seedRand() * Math.PI * 2,
      phaseSpeed: 0.5 + seedRand() * 0.9,
      jitterX: 0,
      jitterY: 0,
    }));
  }, [particleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = 0;
    let last = performance.now();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const { w, h } = sizeRef.current;
      const currentAnchors = anchorsRef.current;
      const isActive = activeRef.current && currentAnchors.length > 0;
      const particles = particlesRef.current;
      const palette = paletteRef.current;

      ctx.clearRect(0, 0, w, h);
      if (w === 0 || h === 0) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Assign / reassign particles to anchors when active.
      if (isActive) {
        particles.forEach((p, i) => {
          if (p.anchorIndex === null || p.anchorIndex >= currentAnchors.length) {
            p.anchorIndex = i % currentAnchors.length;
          }
        });
      } else {
        particles.forEach((p) => {
          p.anchorIndex = null;
        });
      }

      const step = prefersReducedMotion ? dt * 0.15 : dt;

      // Positions of live particles, bucketed by anchor for connecting lines.
      const drawn: { x: number; y: number; r: number; c: [number, number, number]; a: number }[] = [];

      for (const p of particles) {
        p.phase += step * p.phaseSpeed;
        const twinkle = 0.55 + 0.45 * Math.sin(p.phase);

        if (p.anchorIndex !== null) {
          const anchor = currentAnchors[p.anchorIndex];
          const energy = anchor.energy;
          const intensity = anchor.intensity;

          // Target orbit radius shrinks as energy rises, but "done" settles into a
          // tight steady halo rather than collapsing to a point.
          const baseRadius = 22 + (1 - energy) * 58;
          p.targetRadius = baseRadius * (1 - intensity * 0.25);
          p.radius += (p.targetRadius - p.radius) * Math.min(1, step * 1.6);

          const speed = (0.25 + intensity * 1.6) * (0.6 + energy * 0.5);
          p.angle += step * speed * p.angularSpeed * 4;

          let jx = 0;
          let jy = 0;
          if (anchor.color === "breaks") {
            p.jitterX += (Math.random() - 0.5) * 3;
            p.jitterY += (Math.random() - 0.5) * 3;
            p.jitterX *= 0.8;
            p.jitterY *= 0.8;
            jx = p.jitterX;
            jy = p.jitterY;
          }

          const x = anchor.x + Math.cos(p.angle) * p.radius + jx;
          const y = anchor.y + Math.sin(p.angle) * p.radius * p.ellipse + jy;
          const rgb = palette[anchor.color];
          const alpha = (0.4 + energy * 0.48 + intensity * 0.22) * twinkle;
          const size = p.size * (0.9 + energy * 1.0 + intensity * 0.55);

          drawn.push({ x, y, r: size, c: rgb, a: Math.min(alpha, 0.95) });
        } else {
          // Free ambient drift, wrapping at the edges.
          p.fx += p.fvx * step * 6;
          p.fy += p.fvy * step * 6;
          if (p.fx < -0.05) p.fx = 1.05;
          if (p.fx > 1.05) p.fx = -0.05;
          if (p.fy < -0.05) p.fy = 1.05;
          if (p.fy > 1.05) p.fy = -0.05;
          const x = p.fx * w;
          const y = p.fy * h;
          const rgb = palette.stone;
          drawn.push({ x, y, r: p.size * 0.6, c: rgb, a: 0.22 * twinkle + 0.08 });
        }
      }

      // Faint connective threads between nearby particles for a cohesive "field".
      ctx.lineWidth = 0.6;
      const threshold = Math.max(36, Math.min(w, h) * 0.09);
      for (let i = 0; i < drawn.length; i++) {
        for (let j = i + 1; j < drawn.length; j++) {
          const a = drawn[i];
          const b = drawn[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < threshold) {
            const lineAlpha = (1 - dist / threshold) * 0.12 * Math.min(a.a, b.a) * 4;
            if (lineAlpha < 0.01) continue;
            ctx.strokeStyle = `rgba(${a.c[0]}, ${a.c[1]}, ${a.c[2]}, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Soft halo behind each active anchor.
      if (isActive) {
        for (const anchor of currentAnchors) {
          const rgb = palette[anchor.color];
          const glowR = 36 + anchor.energy * 48 + anchor.intensity * 28;
          const grad = ctx.createRadialGradient(
            anchor.x,
            anchor.y,
            0,
            anchor.x,
            anchor.y,
            glowR
          );
          const centerAlpha = 0.07 + anchor.energy * 0.17 + anchor.intensity * 0.08;
          grad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${centerAlpha})`);
          grad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(anchor.x, anchor.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Particles themselves, glow via shadowBlur for a dreamy soft-focus look.
      for (const d of drawn) {
        ctx.shadowColor = `rgba(${d.c[0]}, ${d.c[1]}, ${d.c[2]}, ${d.a})`;
        ctx.shadowBlur = d.r * 3.2;
        ctx.fillStyle = `rgba(${d.c[0]}, ${d.c[1]}, ${d.c[2]}, ${d.a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
    />
  );
}
