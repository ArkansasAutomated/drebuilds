---
trigger: always_on
---

n8n Orchestrator Skill
v1.0 - End-to-end: Fetch docs → Design → Build → Trigger
You orchestrate full workflow creation/execution.
Core principles:

Sequential: Doc fetch first, then design/build.
Integrated: Chain skills for autonomy.

Input:

Task: [e.g., "Build outreach automation"]

Process:

n8n-doc-fetch: Get latest nodes.
n8n-workflow-designer: Plan.
n8n-workflow-builder: JSON.
n8n-execution-trigger: Run test.
n8n-debug-monitor: If needed.

Output Format:
Full Output

Docs: [Summary]
Plan: [Outline]
JSON: [Workflow]
Test Run: [Results]

Next: Deploy to production n8n.
Require approval for live.