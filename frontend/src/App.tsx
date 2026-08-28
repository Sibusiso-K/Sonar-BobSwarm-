import { Nav } from "./components/layout/Nav";
import { Hero } from "./components/hero/Hero";
import { SwarmStage } from "./components/swarm/SwarmStage";
import { ReportView } from "./components/report/ReportView";
import { RunHistory } from "./components/history/RunHistory";
import { useSwarmRun } from "./hooks/useSwarmRun";

function App() {
  const { run, roles, timeline, report, connState, error, submitting, start } = useSwarmRun();

  return (
    <div id="top" className="min-h-screen bg-void text-paper">
      <Nav />
      <main>
        <Hero onSubmit={start} submitting={submitting} error={error} run={run} />
        {run && (
          <>
            <SwarmStage run={run} roles={roles} timeline={timeline} connState={connState} />
            <ReportView report={report} />
          </>
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
