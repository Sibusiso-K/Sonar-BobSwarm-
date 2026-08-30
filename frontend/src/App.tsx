import { useState } from "react";
import { Nav } from "./components/layout/Nav";
import { Hero } from "./components/hero/Hero";
import { BobHandoff } from "./components/hero/BobHandoff";
import { SwarmStage } from "./components/swarm/SwarmStage";
import { ReportView } from "./components/report/ReportView";
import { RunHistory } from "./components/history/RunHistory";
import { useSwarmRun } from "./hooks/useSwarmRun";
import type { AgentRole, RunSummary, TaskType } from "./lib/types";

function App() {
  const { run, roles, timeline, report, connState, error, submitting, start, resume, reset } = useSwarmRun();
  const hasRun = run !== null;
  const [selectedRole, setSelectedRole] = useState<AgentRole | null>(null);

  const handleStart = (input: { taskDescription: string; taskType: TaskType; repoRef: string }) => {
    start(input);
    // Give the swarm section a beat to mount before scrolling to it.
    requestAnimationFrame(() => {
      document.getElementById("swarm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleOpenRun = (summary: RunSummary) => {
    setSelectedRole(null);
    resume(summary.id);
    requestAnimationFrame(() => {
      document.getElementById("swarm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleNewRun = () => {
    setSelectedRole(null);
    reset();
    requestAnimationFrame(() => {
      document.getElementById("run")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div id="top" className="min-h-screen bg-void text-paper">
      <Nav />
      <main>
        <Hero onSubmit={handleStart} submitting={submitting} error={error} />
        {hasRun && run?.status === "pending" && (
          <section id="handoff" className="border-t border-line px-6 py-10 sm:px-10">
            <div className="mx-auto max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-stone">Stage 1.5</p>
              <h2 className="mt-1 font-display text-2xl font-medium text-paper sm:text-3xl">
                Keep Bob in control
              </h2>
              <BobHandoff run={run} />
            </div>
          </section>
        )}
        {/* Stage 2 and the report only take their full-height, glassy empty-state
            treatment once a run actually exists — before that, a single compact
            teaser keeps the page from reading as three stacked "nothing here yet"
            cards under the hero. */}
        {hasRun ? (
          <>
            <SwarmStage
              run={run}
              roles={roles}
              timeline={timeline}
              connState={connState}
              onNewRun={handleNewRun}
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
            />
            <ReportView
              report={report}
              run={run}
              selectedRole={selectedRole}
              onSelectRole={setSelectedRole}
            />
          </>
        ) : (
          <section id="swarm" className="border-t border-line px-6 py-16 sm:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-stone">
                Stage 2 &amp; 3
              </p>
              <p className="mt-2 text-stone-dim">
                The swarm and the unified report appear here the moment you dispatch a task above.
              </p>
            </div>
          </section>
        )}
        <RunHistory onOpenRun={handleOpenRun} />
      </main>
      <footer className="border-t border-line px-6 py-10 text-center font-mono text-xs text-stone-dim sm:px-10">
        BobSwarm — five specialists, one report.
      </footer>
    </div>
  );
}

export default App;
