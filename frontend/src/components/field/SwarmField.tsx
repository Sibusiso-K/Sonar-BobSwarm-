import { useMemo } from "react";

interface SwarmFieldProps {
  density?: number;
  className?: string;
}

/**
 * Ambient backdrop: a scattering of faint dots connected by hairline threads,
 * suggesting a swarm of agents at rest. Purely decorative — aria-hidden.
 */
export function SwarmField({ density = 48, className = "" }: SwarmFieldProps) {
  const points = useMemo(() => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: density }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      r: 0.6 + rand() * 1.4,
      delay: rand() * 6,
    }));
  }, [density]);

  const links = useMemo(() => {
    const result: { a: (typeof points)[number]; b: (typeof points)[number] }[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 7) % points.length];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 28) result.push({ a, b });
    }
    return result;
  }, [points]);

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <g stroke="var(--color-line-strong)" strokeWidth="0.08">
        {links.map(({ a, b }, i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        ))}
      </g>
      <g fill="var(--color-stone-dim)">
        {points.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.y} r={p.r * 0.3}>
            <animate
              attributeName="opacity"
              values="0.25;0.9;0.25"
              dur="5s"
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>
    </svg>
  );
}
