import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MessageSquareText, Users, FileCheck2, ChevronRight } from "lucide-react";
import { LivingSwarmField, type SwarmAnchor } from "../field/LivingSwarmField";
import { TaskForm } from "./TaskForm";
import type { TaskType } from "../../lib/types";

function FlowSteps() {
  const steps = [
    { icon: MessageSquareText, label: "Describe", color: "#e7c37a" },
    { icon: Users, label: "Swarm reads in parallel", color: "#b4a9e8" },
    { icon: FileCheck2, label: "Unified report", color: "#5fa8d9" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-stone">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5"
            style={{
              color: step.color,
              borderColor: `${step.color}59`,
              background: `${step.color}14`,
            }}
          >
            <step.icon className="h-3.5 w-3.5" />
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone-dim" />
          )}
        </div>
      ))}
    </div>
  );
}

/** Unlabeled vertical "wing" of drifting particles, floating beside the centered task box. */
function SwarmWing({ anchors, delay = 0 }: { anchors: SwarmAnchor[]; delay?: number }) {
  return (
    <motion.div
      aria-hidden
      animate={{ y: [0, -16, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay }}
      className="relative hidden h-[420px] w-[200px] shrink-0 xl:block"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
      }}
    >
      <LivingSwarmField
        anchors={anchors}
        active
        particleCount={100}
        className="absolute inset-0 h-full w-full"
      />
    </motion.div>
  );
}

const TASKBOX_LEFT_ANCHORS: SwarmAnchor[] = [
  { id: "tb-a", x: 110, y: 120, energy: 0.9, intensity: 0.55, color: "gold" },
  { id: "tb-b", x: 80, y: 320, energy: 0.35, intensity: 0.8, color: "violet" },
];

const TASKBOX_RIGHT_ANCHORS: SwarmAnchor[] = [
  { id: "tb-c", x: 120, y: 100, energy: 0.55, intensity: 1, color: "violet" },
  { id: "tb-d", x: 80, y: 260, energy: 0.45, intensity: 0.65, color: "violet" },
  { id: "tb-e", x: 130, y: 380, energy: 0.4, intensity: 0.5, color: "stone" },
];

export function Hero({
  onSubmit,
  submitting,
  error,
}: {
  onSubmit: (input: { taskDescription: string; taskType: TaskType; repoRef: string }) => void;
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

      {/* heading on the left, labeled swarm panel on the right */}
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-16 lg:grid-cols-[1.1fr_0.9fr]">
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
            className="text-balance font-display text-4xl font-medium leading-[1.15] tracking-tight text-paper sm:text-6xl"
          >
            Five specialists read your code.
            <br />
            Every finding,{" "}
            <span className="pr-1 text-gradient-gold italic">a literal quote.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-lg text-balance text-base text-paper-dim sm:text-lg"
          >
            Describe an engineering task in plain language. A debugger, documenter, refactorer,
            onboarding guide, and data-lineage tracer read your repo in parallel and hand back one
            unified report , every finding backed by real quoted source, not a paraphrased guess.
          </motion.p>
          
        </motion.div>

        <div
          aria-hidden
          className="relative hidden h-[440px] mt-[52px] overflow-hidden rounded-3xl border border-line-strong bg-void-soft/40 lg:block"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 420px 320px at 12% 82%, rgba(139,123,216,0.10), transparent 60%), radial-gradient(ellipse 360px 280px at 88% 45%, rgba(139,123,216,0.12), transparent 60%), radial-gradient(ellipse 320px 260px at 42% 15%, rgba(217,164,65,0.14), transparent 60%)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 grain rounded-3xl" />

          <div className="relative flex items-center justify-between px-5 pt-5">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-stone">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
              swarm · 5 agents live
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone/70">
              parallel
            </span>
          </div>

          {SWARM_ROLES.map((role) => (
            <div
              key={role.id}
              className="pointer-events-none absolute -translate-x-1/2 translate-y-3 text-center"
              style={{ left: `${role.left}%`, top: `${role.top}%` }}
            >
              <span
                className="whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] backdrop-blur-sm"
                style={{
                  color: role.textColor,
                  borderColor: role.borderColor,
                  background: role.bg,
                }}
              >
                {role.label}
              </span>
            </div>
          ))}

          <LivingSwarmField
            anchors={SWARM_ANCHORS}
            active
            particleCount={220}
            className="absolute inset-0 h-full w-full rounded-3xl"
          />
        </div>
      </div>

      {/* centered task box, unlabeled swarm wings floating either side, flow steps above it */}
      <div className="relative z-10 mt-14 flex w-full max-w-6xl flex-col items-center self-center">
        <div className="mb-8">
          <FlowSteps />
        </div>
        <div className="flex w-full items-center justify-center gap-6 xl:gap-10">
          <SwarmWing anchors={TASKBOX_LEFT_ANCHORS} delay={0} />
          <div className="relative w-full max-w-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] bg-gold/[0.05] blur-[80px]"
            />
            <TaskForm onSubmit={onSubmit} submitting={submitting} />
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-lg border border-breaks/30 bg-breaks/10 px-4 py-2 text-center text-sm text-breaks"
              >
                {error}
              </motion.p>
            )}
          </div>
          <SwarmWing anchors={TASKBOX_RIGHT_ANCHORS} delay={1.2} />
        </div>
      </div>
    </section>
  );
}

const SWARM_ANCHORS = [
  { id: "a", x: 150, y: 70, energy: 0.92, intensity: 0.55, color: "gold" as const },
  { id: "b", x: 330, y: 130, energy: 0.55, intensity: 1, color: "violet" as const },
  { id: "c", x: 80, y: 200, energy: 0.3, intensity: 0.75, color: "violet" as const },
  { id: "d", x: 280, y: 280, energy: 0.45, intensity: 0.65, color: "violet" as const },
  { id: "e", x: 150, y: 350, energy: 0.85, intensity: 0.5, color: "gold" as const },

];

const SWARM_ROLES = [
  { id: "a", label: "Debugger", left: 39, top: 17, textColor: "#e7c37a", borderColor: "rgba(217,164,65,0.35)", bg: "rgba(217,164,65,0.08)" },
  { id: "b", label: "Documenter", left: 87, top: 31, textColor: "#b4a9e8", borderColor: "rgba(139,123,216,0.35)", bg: "rgba(139,123,216,0.08)" },
  { id: "c", label: "Refactorer", left: 21, top: 48, textColor: "#b4a9e8", borderColor: "rgba(139,123,216,0.35)", bg: "rgba(139,123,216,0.08)" },
  { id: "d", label: "Onboarding guide", left: 74, top: 67, textColor: "#b4a9e8", borderColor: "rgba(139,123,216,0.35)", bg: "rgba(139,123,216,0.08)" },
  { id: "e", label: "Data lineage", left: 39, top: 83, textColor: "#b9b0a0", borderColor: "rgba(184,176,160,0.3)", bg: "rgba(184,176,160,0.07)" },
];
