# Third-Party Software Notices

BobSwarm was built during the contest window and uses the following direct open-source dependencies. Versions below reflect the verified installation on 29 August 2026; the tracked package manifests and lockfiles remain the source of truth for reproducible builds.

| Component | Version | Licence | Used by |
|---|---:|---|---|
| `@modelcontextprotocol/sdk` | 1.30.0 | MIT | MCP server |
| `simple-git` | 3.36.0 | MIT | MCP Git tools |
| `glob` | 11.1.0 | BlueOak-1.0.0 | MCP filesystem discovery |
| `ws` | 8.21.3 | MIT | Live WebSocket events |
| `react` | 19.2.8 | MIT | Dashboard |
| `react-dom` | 19.2.8 | MIT | Dashboard |
| `framer-motion` | 13.1.1 | MIT | Dashboard animation |
| `lucide-react` | 1.35.0 | ISC | Dashboard icons |
| `tailwindcss` | 4.3.3 | MIT | Dashboard styling |
| `@tailwindcss/vite` | 4.3.3 | MIT | Dashboard build tooling |
| `vite` | 8.2.2 | MIT | Dashboard build tooling |
| `@vitejs/plugin-react` | 6.1.1 | MIT | Dashboard build tooling |
| `typescript` | 6.0.3 | Apache-2.0 | Dashboard build tooling |
| `oxlint` | 1.80.0 | MIT | Dashboard linting |
| `@types/node` | 24.13.3 | MIT | Type definitions |
| `@types/react` | 19.2.18 | MIT | Type definitions |
| `@types/react-dom` | 19.2.5 | MIT | Type definitions |

The full dependency graphs are recorded in `frontend/package-lock.json` and `mcp-server/package-lock.json`. Copyright and licence texts for installed packages are distributed in their respective package directories by npm. BobSwarm does not include client data, social-media data, proprietary datasets, or external model outputs as runtime dependencies.

Google Fonts used by the dashboard—Fraunces, IBM Plex Mono, and Inter—are loaded from Google Fonts at runtime. Their use should be included in the final deployment privacy and network review if the proof of concept is taken beyond the contest demo.
