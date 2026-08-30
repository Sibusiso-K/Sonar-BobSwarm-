import { Bug, BookOpen, Wrench, Compass, GitBranch } from "lucide-react";
import type { AgentRole } from "../../lib/types";

export const ROLE_META: Record<AgentRole, { label: string; icon: typeof Bug }> = {
  debugger: { label: "Debugger", icon: Bug },
  documenter: { label: "Documenter", icon: BookOpen },
  refactorer: { label: "Refactorer", icon: Wrench },
  onboarding: { label: "Onboarding", icon: Compass },
  data_lineage: { label: "Data lineage", icon: GitBranch },
};
