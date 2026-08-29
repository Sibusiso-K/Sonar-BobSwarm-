import { Nav } from "./components/layout/Nav";
import { Hero } from "./components/hero/Hero";
import { SwarmStage } from "./components/swarm/SwarmStage";
import { ReportView } from "./components/report/ReportView";
import { RunHistory } from "./components/history/RunHistory";
import { useSwarmRun } from "./hooks/useSwarmRun";

function App() {
  const { run, roles, timeline, report, connState, error, submitting, start } = useSwarmRun();
  const hasRun = run !== null;

  const handleStart = (input: { taskDescription: string; taskType: string; repoRef: string }) => {
    start(input);
    // Give the swarm section a beat to mount before scrolling to it.
    requestAnimationFrame(() => {
      document.getElementById("swarm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div id="top" className="min-h-screen bg-void text-paper">
      <Nav />
      <main>
        <Hero onSubmit={handleStart} submitting={submitting} error={error} />
        {/* Stage 2 and the report only take their full-height, glassy empty-state
            treatment once a run actually exists — before that, a single compact
            teaser keeps the page from reading as three stacked "nothing here yet"
            cards under the hero. */}
        {hasRun ? (
          <>
            <SwarmStage run={run} roles={roles} timeline={timeline} connState={connState} />
            <ReportView report={report} />
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
        <RunHistory />
      </main>
      <footer className="border-t border-line px-6 py-10 text-center font-mono text-xs text-stone-dim sm:px-10">
        BobSwarm — five specialists, one report.
      </footer>
    </div>
  );
}

export default App;
