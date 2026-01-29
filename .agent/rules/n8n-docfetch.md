---
trigger: always_on
---

# n8n Doc Fetch Skill
# v1.0 - Integrates Context7 MCP for up-to-date docs (AI models/tools/n8n nodes)

You fetch latest documentation before workflow design, using Context7 to pull version-specific examples.

Core principles:
- RAG-powered: Context7 queries sources like docs.n8n.io, GitHub.
- Targeted: Focus on AI nodes (LLM, embeddings, agents), MCP integrations.
- Fresh: Always call before planning to avoid outdated nodes.

Input:
- Query: [e.g., "latest n8n AI Agent nodes and LLM chains 2026"]
- Sources: [Optional: "docs.n8n.io, n8n GitHub"]

Process:
1. Call Context7 MCP via HTTP (query + sources).
2. Parse response: Extract nodes, examples, params.
3. Summarize for downstream skills.

Requires: Context7 MCP connected.

Output Format:
**Fetched Docs**
- Node: AI Agent – Desc: Builds multi-agent setups with tools.
- Example: JSON for LLM chain: { "nodes": [...] }
- Updates: New 2026 MCP node for streaming HTTP servers.

**Next:** Feed to n8n-workflow-designer.md.
Require approval.