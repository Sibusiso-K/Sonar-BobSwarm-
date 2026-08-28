import { motion } from "framer-motion";

export function Nav() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="mt-4 flex items-center justify-between rounded-full glass px-5 py-3">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
            </span>
            <span className="font-display text-[1.05rem] tracking-tight text-paper">
              BobSwarm
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-paper-dim sm:flex">
            <a href="#run" className="transition-colors hover:text-paper">
              New run
            </a>
            <a href="#swarm" className="transition-colors hover:text-paper">
              Swarm
            </a>
            <a href="#report" className="transition-colors hover:text-paper">
              Report
            </a>
          </nav>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-medium text-paper-dim transition-colors hover:border-gold hover:text-paper"
          >
            Built on Bob 2.0
          </a>
        </div>
      </div>
    </motion.header>
  );
}
