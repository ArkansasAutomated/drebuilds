export type SeoPage = {
  slug: string;
  name: string;
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  sectors: string[];
  workflows: { title: string; description: string }[];
  localInsight: string;
  faq: { question: string; answer: string }[];
};

export const locationPages: SeoPage[] = [
  {
    slug: "fort-smith",
    name: "Fort Smith",
    eyebrow: "Fort Smith · River Valley",
    title: "AI Automation for Fort Smith Businesses",
    description: "Practical AI and workflow automation for Fort Smith manufacturers, service companies, logistics teams, and growing local businesses.",
    intro: "DREBUILDS helps Fort Smith teams remove repetitive work without replacing the tools and people they already trust. We map the handoffs slowing the business down, build the right automation, and keep a human in control where judgment matters.",
    sectors: ["Manufacturing", "Logistics", "Home services", "Healthcare administration"],
    workflows: [
      { title: "Quote-to-job handoffs", description: "Move approved estimates into scheduling, work orders, and customer updates without retyping the same information." },
      { title: "Document processing", description: "Extract, route, and verify information from invoices, purchase orders, applications, and service records." },
      { title: "Lead response", description: "Capture calls and forms, qualify the request, and alert the right person while buyer intent is still high." },
    ],
    localInsight: "Fort Smith businesses often operate across the Arkansas–Oklahoma region. We design workflows that can handle multiple service territories, branches, and approval chains without creating another disconnected system.",
    faq: [
      { question: "What can a Fort Smith business automate first?", answer: "Start with a high-volume process that is repetitive, rules-based, and easy to measure—lead follow-up, document entry, scheduling updates, or recurring reports are common first projects." },
      { question: "Do you work with existing business software?", answer: "Yes. The goal is usually to connect and improve the systems you already use, including CRMs, spreadsheets, email, calendars, forms, accounting tools, and industry platforms." },
    ],
  },
  {
    slug: "little-rock",
    name: "Little Rock",
    eyebrow: "Little Rock · Central Arkansas",
    title: "AI Automation for Little Rock Organizations",
    description: "AI automation and business process consulting for Little Rock service firms, healthcare teams, financial operations, and public-sector vendors.",
    intro: "DREBUILDS builds accountable automation for Little Rock organizations where speed matters but oversight cannot disappear. Every workflow starts with the business rule, the data involved, and the human decision points—not a generic chatbot.",
    sectors: ["Professional services", "Healthcare operations", "Financial services", "Government contractors"],
    workflows: [
      { title: "Client intake and routing", description: "Collect complete information, identify urgency, and route each request to the right team or location." },
      { title: "Compliance-ready workflows", description: "Add permissions, review steps, audit trails, and exception handling to sensitive operational processes." },
      { title: "Reporting automation", description: "Turn recurring spreadsheet and dashboard work into a reliable, scheduled operating rhythm." },
    ],
    localInsight: "Central Arkansas organizations frequently balance customer service with regulated or approval-heavy operations. Our approach keeps sensitive decisions reviewable and makes exceptions visible instead of hiding them inside a black box.",
    faq: [
      { question: "Can AI automation support regulated workflows?", answer: "Yes, when it is designed with access controls, data minimization, logging, and human approval. We define those safeguards before choosing the automation tools." },
      { question: "How long does an automation project take?", answer: "A focused workflow can often be scoped in days and implemented in weeks. Larger projects are divided into measurable phases so value arrives before a long transformation program is complete." },
    ],
  },
  {
    slug: "fayetteville",
    name: "Fayetteville",
    eyebrow: "Fayetteville · Northwest Arkansas",
    title: "AI Automation for Fayetteville Businesses",
    description: "Custom AI workflows for Fayetteville professional services, startups, healthcare practices, education teams, and growing local operators.",
    intro: "DREBUILDS helps Fayetteville teams turn scattered tools and manual follow-up into one dependable operating system. We focus on automations people will actually use: clear triggers, visible ownership, and straightforward recovery when something needs attention.",
    sectors: ["Startups", "Professional services", "Healthcare practices", "Education"],
    workflows: [
      { title: "Sales and onboarding", description: "Connect lead capture, qualification, proposals, scheduling, and the first client handoff." },
      { title: "Knowledge assistants", description: "Give teams a governed way to search approved procedures, documents, and internal answers." },
      { title: "Operations alerts", description: "Watch the systems that matter and surface exceptions before they become customer problems." },
    ],
    localInsight: "Fayetteville combines university talent, fast-growing professional firms, and owner-operated businesses. That makes lightweight, maintainable systems especially valuable: teams need leverage without adding enterprise software overhead.",
    faq: [
      { question: "Is AI automation only for large Fayetteville companies?", answer: "No. Small teams often benefit fastest because one repetitive process can consume a meaningful share of the week. The key is choosing a narrow workflow with a clear owner and measurable result." },
      { question: "Can you automate work across Google Workspace or Microsoft 365?", answer: "Yes. Email, calendars, documents, spreadsheets, and forms are common building blocks, along with CRMs, accounting systems, and industry-specific software." },
    ],
  },
  {
    slug: "bentonville",
    name: "Bentonville",
    eyebrow: "Bentonville · Northwest Arkansas",
    title: "AI Automation for Bentonville Teams",
    description: "AI and workflow automation for Bentonville suppliers, retail operations, agencies, logistics teams, and fast-growing businesses.",
    intro: "DREBUILDS builds practical automation for Bentonville teams managing high expectations, multiple systems, and constant operational handoffs. We connect the work around retail, suppliers, reporting, and service delivery so your people can focus on decisions instead of data movement.",
    sectors: ["Retail suppliers", "Logistics", "Agencies", "Professional services"],
    workflows: [
      { title: "Supplier reporting", description: "Standardize recurring data collection, validation, reporting, and stakeholder delivery." },
      { title: "Account operations", description: "Keep briefs, approvals, tasks, files, and client updates synchronized across the team." },
      { title: "Inventory and exception alerts", description: "Monitor critical thresholds and route exceptions to the person who can act." },
    ],
    localInsight: "Bentonville businesses often support retail and supplier ecosystems where deadlines, data accuracy, and response time are tightly connected. Automation should strengthen those controls, not add another dashboard nobody checks.",
    faq: [
      { question: "Can you connect supplier portals and internal tools?", answer: "Often, yes. The integration method depends on the platform: supported APIs are preferred, while approved exports, email workflows, and controlled browser automation can cover other cases." },
      { question: "What does the free automation audit include?", answer: "The audit identifies repetitive workflows, estimates business impact, flags data and integration constraints, and recommends the best first project rather than forcing a predetermined tool." },
    ],
  },
  {
    slug: "rogers",
    name: "Rogers",
    eyebrow: "Rogers · Northwest Arkansas",
    title: "AI Automation for Rogers Businesses",
    description: "Business automation for Rogers service companies, retail operators, healthcare practices, construction teams, and growing offices.",
    intro: "DREBUILDS helps Rogers businesses respond faster and operate with less manual coordination. From inbound leads to job completion, we design workflows that reduce dropped handoffs and make the next action obvious.",
    sectors: ["Home services", "Construction", "Retail", "Healthcare practices"],
    workflows: [
      { title: "Missed-call recovery", description: "Respond to missed callers, capture the request, and create a clear follow-up task." },
      { title: "Scheduling coordination", description: "Connect intake, availability, confirmations, reminders, and rescheduling." },
      { title: "Job completion follow-up", description: "Trigger review requests, maintenance reminders, invoice follow-up, and customer check-ins." },
    ],
    localInsight: "Rogers combines fast residential growth with regional retail and service demand. The biggest automation wins often sit between marketing, the front office, and field delivery—exactly where ownership can become unclear.",
    faq: [
      { question: "Will automation replace our customer service team?", answer: "It should not replace the judgment and relationship work customers value. Good automation handles repetitive collection, routing, reminders, and status updates so people can focus on the conversation." },
      { question: "Can we start with one workflow?", answer: "Yes. A focused first workflow is the preferred approach because it creates a measurable baseline, proves the integration pattern, and reduces implementation risk." },
    ],
  },
  {
    slug: "springdale",
    name: "Springdale",
    eyebrow: "Springdale · Northwest Arkansas",
    title: "AI Automation for Springdale Operations",
    description: "Workflow automation for Springdale manufacturing, food production, logistics, construction, and service businesses.",
    intro: "DREBUILDS helps Springdale operators automate the administrative work surrounding physical operations. We connect forms, documents, alerts, approvals, and reporting while keeping frontline workflows simple.",
    sectors: ["Food production", "Manufacturing", "Logistics", "Construction"],
    workflows: [
      { title: "Quality and issue routing", description: "Capture incidents consistently, notify owners, and track follow-up through resolution." },
      { title: "Purchase and invoice workflows", description: "Extract key fields, match documents, route approvals, and flag exceptions." },
      { title: "Shift and field reporting", description: "Turn mobile-friendly submissions into structured records and management summaries." },
    ],
    localInsight: "Springdale’s industrial and logistics base makes reliability more important than novelty. We favor workflows with clear failure states, human escalation, and documentation that your team can maintain.",
    faq: [
      { question: "Can automation work with paper-heavy processes?", answer: "Yes. A common first step is digitizing intake with mobile forms or document capture, then routing the information through review and approval without losing the original record." },
      { question: "How do you prevent bad AI output?", answer: "We restrict AI to appropriate tasks, validate structured outputs, set confidence thresholds, and route uncertain cases to a human instead of pretending every answer is reliable." },
    ],
  },
  {
    slug: "jonesboro",
    name: "Jonesboro",
    eyebrow: "Jonesboro · Northeast Arkansas",
    title: "AI Automation for Jonesboro Businesses",
    description: "Practical AI automation for Jonesboro healthcare operations, manufacturing, agriculture, education, and service businesses.",
    intro: "DREBUILDS gives Jonesboro teams a practical route from manual processes to controlled automation. We focus on the operational layer—intake, documents, scheduling, handoffs, and reporting—where time and accuracy can be measured.",
    sectors: ["Healthcare operations", "Manufacturing", "Agribusiness", "Education"],
    workflows: [
      { title: "Referral and request intake", description: "Collect complete information, identify missing items, and route each request appropriately." },
      { title: "Production administration", description: "Automate status updates, exception notifications, and recurring operational reports." },
      { title: "Service communications", description: "Send confirmations, reminders, document requests, and follow-up based on real workflow status." },
    ],
    localInsight: "Jonesboro serves as a regional hub for healthcare, education, manufacturing, and agriculture. Automation can help smaller administrative teams support that wider service area without sacrificing response quality.",
    faq: [
      { question: "What information do you need for an automation audit?", answer: "A simple description of the process, who touches it, the tools involved, approximate volume, and where delays or errors occur is enough to begin." },
      { question: "Do we have to move our data to a new platform?", answer: "Not necessarily. Many projects connect existing systems and keep the system of record in place. Any data movement is evaluated for security, reliability, and operational ownership." },
    ],
  },
  {
    slug: "conway",
    name: "Conway",
    eyebrow: "Conway · Central Arkansas",
    title: "AI Automation for Conway Businesses",
    description: "AI workflow automation for Conway technology teams, professional services, education, healthcare, and local service companies.",
    intro: "DREBUILDS helps Conway businesses turn growth into repeatable operations. We map the work that depends on memory, inboxes, and manual spreadsheets, then build a system that keeps the right person informed.",
    sectors: ["Technology", "Professional services", "Education", "Local services"],
    workflows: [
      { title: "Lead-to-client systems", description: "Connect inquiry capture, qualification, scheduling, proposals, and onboarding." },
      { title: "Internal request desks", description: "Standardize requests, answer common questions, and route exceptions to the right owner." },
      { title: "Executive reporting", description: "Combine operational data into scheduled summaries with clear definitions and source links." },
    ],
    localInsight: "Conway’s mix of technology, education, healthcare, and owner-led companies creates strong demand for systems that can scale without becoming difficult to administer. Maintainability is part of every build.",
    faq: [
      { question: "What is the difference between AI and workflow automation?", answer: "Workflow automation follows defined triggers and rules. AI is useful inside a workflow when the task involves language, classification, extraction, or drafting. Most reliable systems combine both." },
      { question: "Who owns the automation after launch?", answer: "Your business does. We document the workflow, clarify platform ownership, and can provide ongoing support when requested." },
    ],
  },
];

export const servicePages: SeoPage[] = [
  {
    slug: "ai-agents",
    name: "AI Agents",
    eyebrow: "Service · Controlled agentic systems",
    title: "Custom AI Agents for Arkansas Businesses",
    description: "Design and implementation of controlled AI agents for customer service, internal knowledge, operations, and business workflows in Arkansas.",
    intro: "A business AI agent is software that can interpret a request, use approved tools, and complete defined steps under clear limits. DREBUILDS builds agents around real operating procedures with permissions, logs, and human escalation—not open-ended autonomy.",
    sectors: ["Customer support", "Internal knowledge", "Operations", "Sales support"],
    workflows: [
      { title: "Knowledge agents", description: "Answer team questions from approved documents and link every response back to its source." },
      { title: "Service agents", description: "Collect customer intent, resolve routine requests, and escalate sensitive or unusual cases." },
      { title: "Operations agents", description: "Review queues, prepare actions, update systems, and ask for approval at defined checkpoints." },
    ],
    localInsight: "For Arkansas small and midsize businesses, the best agent projects are narrow enough to govern and valuable enough to measure. We begin with one role, one set of tools, and explicit stop conditions.",
    faq: [
      { question: "What is an AI agent for business?", answer: "A business AI agent is a controlled software system that interprets information and takes approved actions across tools. Unlike a basic chatbot, it can participate in a workflow, but it should still operate within permissions, validation rules, and escalation paths." },
      { question: "Are AI agents safe for business data?", answer: "Safety depends on architecture. We minimize exposed data, restrict tool permissions, separate environments, log important actions, and require human approval for higher-risk decisions." },
    ],
  },
  {
    slug: "workflow-automation",
    name: "Workflow Automation",
    eyebrow: "Service · Business process automation",
    title: "Workflow Automation for Arkansas Businesses",
    description: "Connect forms, email, spreadsheets, CRMs, accounting tools, and operations systems with reliable workflow automation.",
    intro: "Workflow automation moves information and tasks through a repeatable business process. DREBUILDS connects the systems your Arkansas team already uses, removes duplicate entry, and makes exceptions visible instead of silently failing.",
    sectors: ["Operations", "Sales", "Finance administration", "Customer service"],
    workflows: [
      { title: "Lead workflows", description: "Capture, enrich, route, notify, follow up, and measure every inbound opportunity." },
      { title: "Back-office workflows", description: "Automate document intake, approvals, record updates, reconciliation, and reporting." },
      { title: "Customer workflows", description: "Coordinate onboarding, reminders, status updates, renewals, and feedback requests." },
    ],
    localInsight: "The highest-return workflow is often not the most complicated. Arkansas teams can gain meaningful capacity by fixing a single handoff that happens dozens of times each week.",
    faq: [
      { question: "What is business workflow automation?", answer: "Business workflow automation uses triggers, rules, and integrations to move information and tasks between people and software. It reduces repetitive work while preserving defined approvals and exception handling." },
      { question: "Which workflow should we automate first?", answer: "Choose a frequent process with clear rules, measurable delay or labor, and a stable owner. Avoid starting with a rare process or one that the team has not agreed how to perform." },
    ],
  },
  {
    slug: "lead-follow-up",
    name: "Lead Follow-Up",
    eyebrow: "Service · Revenue operations",
    title: "Automated Lead Follow-Up for Arkansas Service Businesses",
    description: "Capture, qualify, route, and follow up with new leads from forms, calls, ads, and referrals without losing the human touch.",
    intro: "Lead follow-up automation makes sure every legitimate inquiry receives a timely response and a clear owner. DREBUILDS connects your forms, phone workflows, CRM, calendar, email, and text tools around the way your team actually sells.",
    sectors: ["Home services", "Professional services", "Healthcare practices", "Construction"],
    workflows: [
      { title: "Instant acknowledgement", description: "Confirm the inquiry, set expectations, and collect the next required detail." },
      { title: "Qualification and routing", description: "Use location, service, urgency, value, and availability to assign the right next step." },
      { title: "Follow-up sequences", description: "Create useful reminders and owner alerts that stop when a lead replies or books." },
    ],
    localInsight: "For local Arkansas service businesses, speed-to-lead matters because buyers often contact more than one provider. The system should create a faster human conversation, not bury the customer in automated messages.",
    faq: [
      { question: "Can automated follow-up feel personal?", answer: "Yes, when messages reflect the actual inquiry, identify the business clearly, and make it easy to reach a person. Automation should support responsiveness, not imitate a relationship that has not happened." },
      { question: "Does this work with our current CRM?", answer: "Usually. We first check the CRM’s API, webhooks, native integrations, and data model, then design the lightest reliable connection." },
    ],
  },
  {
    slug: "document-automation",
    name: "Document Automation",
    eyebrow: "Service · Document intelligence",
    title: "AI Document Automation for Arkansas Operations",
    description: "Extract, classify, validate, route, and summarize invoices, forms, applications, reports, and operational documents.",
    intro: "AI document automation turns unstructured files into reviewable business data. DREBUILDS combines extraction with validation and human review so teams can process documents faster without treating uncertain output as fact.",
    sectors: ["Accounting administration", "Healthcare operations", "Logistics", "Manufacturing"],
    workflows: [
      { title: "Data extraction", description: "Read consistent fields from PDFs, scans, email attachments, and submitted forms." },
      { title: "Validation and matching", description: "Check values against business rules and existing records before updating a system." },
      { title: "Summaries and routing", description: "Create concise review notes and send the document to the correct queue or owner." },
    ],
    localInsight: "Document-heavy Arkansas businesses can reduce administrative load without giving up verification. Confidence thresholds and exception queues are core parts of the design.",
    faq: [
      { question: "Can AI read scanned documents?", answer: "Often, yes. Results depend on scan quality, layout consistency, handwriting, and the fields required. We test representative documents before promising an automation rate." },
      { question: "What happens when the AI is uncertain?", answer: "The workflow flags the item for human review, preserves the original document, and records the correction so the operational process remains accountable." },
    ],
  },
  {
    slug: "ai-consulting",
    name: "AI Consulting",
    eyebrow: "Service · Strategy and implementation",
    title: "Practical AI Consulting in Arkansas",
    description: "AI opportunity assessment, workflow mapping, vendor selection, governance, prototyping, and implementation for Arkansas organizations.",
    intro: "Practical AI consulting starts with business constraints, not a list of tools. DREBUILDS helps Arkansas leaders identify valuable use cases, reject weak ones, and move the best opportunity into a controlled production workflow.",
    sectors: ["Leadership teams", "Operations", "IT and data", "Revenue teams"],
    workflows: [
      { title: "Opportunity audit", description: "Inventory repetitive work and score ideas by impact, feasibility, data readiness, and risk." },
      { title: "Solution design", description: "Define the workflow, ownership, integrations, safeguards, success measures, and implementation plan." },
      { title: "Pilot and rollout", description: "Build a narrow production pilot, measure the result, train owners, and expand only when justified." },
    ],
    localInsight: "Arkansas organizations do not need an abstract AI roadmap. They need a prioritized operating plan that reflects staffing, existing software, customer expectations, and industry obligations.",
    faq: [
      { question: "What does an AI consultant do?", answer: "An AI consultant identifies appropriate use cases, evaluates data and risk, designs the system, selects tools, and helps implement measurable workflows. Good consulting also explains when AI is unnecessary." },
      { question: "How do we know whether an AI project is worth it?", answer: "Estimate current process volume, labor, delay, errors, and revenue impact. Compare that baseline with the build and operating cost, then define a measurable threshold the pilot must reach." },
    ],
  },
];

export const allSeoPages = [...locationPages, ...servicePages];
