import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { LivingSwarmField } from "../field/LivingSwarmField";
import { TaskForm } from "./TaskForm";

export function Hero({
  onSubmit,
  submitting,
  error,
}: {
  onSubmit: (input: { taskDescription: string; taskType: string; repoRef: string }) => void;
  submitting: boolean;
  error: string | null;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smoothX = useSpring(mx, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(my, { stiffness: 60, damping: 20 });

  const goldX = useTransform(smoothX, [0, 1], [-24, 24]);
  const goldY = useTransform(smoothY, [0, 1], [-18, 18]);
  const violetX = useTransform(smoothX, [0, 1], [22, -22]);
  const violetY = useTransform(smoothY, [0, 1], [16, -16]);
  const contentRotateX = useTransform(smoothY, [0, 1], [1.6, -1.6]);
  const contentRotateY = useTransform(smoothX, [0, 1], [-1.6, 1.6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  return (
    <section
      id="run"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pb-20 pt-32 sm:px-10"
    >
      <LivingSwarmField
        anchors={[]}
        active={false}
        particleCount={90}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      />
      <motion.div
        aria-hidden
        style={{ x: goldX, y: goldY }}
        className="pointer-events-none absolute left-1/2 top-1/3 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 animate-drift rounded-full bg-gold/[0.07] blur-[120px]"
      />
      <motion.div
        aria-hidden
        style={{ x: violetX, y: violetY }}
        className="pointer-events-none absolute left-1/3 top-2/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/[0.07] blur-[110px]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-start gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          style={{ rotateX: contentRotateX, rotateY: contentRotateY, transformPerspective: 1400 }}
          className="relative flex flex-col items-start text-left"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 rounded-full border border-line-strong px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-stone"
          >
            five specialists · one report
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance font-display text-4xl font-medium leading-[1.05] tracking-tight text-paper sm:text-6xl"
          >
            Five specialists read your code.
            <br />
            Every finding, <span className="text-gradient-gold italic">a literal quote.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-lg text-balance text-base text-paper-dim sm:text-lg"
          >
            Describe an engineering task in plain language. A debugger, documenter, refactorer,
            onboarding guide, and data-lineage tracer read your repo in parallel and hand back one
            unified report — every finding backed by real quoted source, not a paraphrased guess.
          </motion.p>
          <div className="mt-10 w-20">
            <TaskForm onSubmit={onSubmit} submitting={submitting} />
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-lg border border-breaks/30 bg-breaks/10 px-4 py-2 text-sm text-breaks"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
        <div
          aria-hidden
          className="relative hidden h-[420px] mt-[52px] rounded-3xl border border-line lg:block"
        >
          <LivingSwarmField
            anchors={[
              { id: "a", x: 140, y: 70, energy: 0.85, intensity: 0.5, color: "gold" },
              { id: "b", x: 300, y: 160, energy: 0.5, intensity: 1, color: "violet" },
              { id: "c", x: 90, y: 220, energy: 0.3, intensity: 0.7, color: "violet" },
            ]}
            active
            particleCount={140}
            className="absolute inset-0 h-full w-full rounded-3xl"
          />
        </div>
      </div>
    </section>
  );
}