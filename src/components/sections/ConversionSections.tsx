import { Link } from "react-router-dom";
import { ArrowRight, Check, FileText, Gauge, Link2, MapPin, MessageSquareText, ShieldCheck } from "lucide-react";
import { locationPages, servicePages } from "@/data/seoPages";

const outcomes = [
  { icon: MessageSquareText, title: "Respond while leads are still looking", body: "Capture calls and forms, qualify the request, and put the next action in front of the right person." },
  { icon: Link2, title: "Connect the tools you already pay for", body: "Move clean data between your CRM, inbox, calendar, forms, spreadsheets, accounting tools, and industry software." },
  { icon: FileText, title: "Process documents without blind trust", body: "Extract and route information with validation, confidence thresholds, and human review for exceptions." },
  { icon: Gauge, title: "See the bottleneck before adding headcount", body: "Make queue volume, response time, ownership, and failures visible so operations can improve." },
];

const process = [
  ["01", "Audit the workflow", "We document the trigger, people, tools, rules, volume, exceptions, and cost of the current process."],
  ["02", "Design the control points", "You see exactly what will automate, what stays human, what data moves, and how success is measured."],
  ["03", "Ship a focused system", "We build the smallest production workflow that can create a measurable business result."],
  ["04", "Measure and improve", "We monitor failures, adoption, time saved, response speed, and the next justified expansion."],
];

const faqs = [
  ["What does DREBUILDS automate?", "DREBUILDS automates repetitive business workflows involving lead intake, follow-up, documents, scheduling, reporting, customer communication, and system-to-system data movement. AI is used when language or judgment support is useful; deterministic rules handle work that needs consistency."],
  ["Is AI automation practical for a small Arkansas business?", "Yes—if the first project is narrow and measurable. Small teams often benefit from automating a process that repeats every day, such as responding to new leads, collecting documents, updating records, or sending status communications."],
  ["Will we need to replace our current software?", "Usually not. Most projects improve the connections between tools already in use. A replacement is only recommended when the current system cannot reliably support the required workflow."],
  ["How do you protect our data?", "Each project begins with data minimization, access controls, platform ownership, logging, retention, and human-approval requirements. Sensitive decisions are not handed to an unrestricted AI model."],
  ["What happens after the free audit?", "You receive a prioritized view of automation opportunities and a recommended first workflow. If there is a strong fit, DREBUILDS can scope and implement it; there is no obligation to proceed."],
];

export const ConversionSections = () => (
  <>
    <section className="border-y border-border bg-card/40 py-5">
      <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 font-mono text-xs text-muted-foreground">
        <span className="text-primary">ARKANSAS-BASED</span>
        <span>Human-controlled automation</span>
        <span>Works with existing tools</span>
        <span>Start with one measurable workflow</span>
      </div>
    </section>

    <section id="outcomes" className="py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="section-label mb-4">// OUTCOMES_OVER_HYPE</p>
          <h2 className="text-3xl font-bold md:text-5xl">Stop paying people to move information between systems.</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">The best automation is almost invisible. Work arrives complete, the right person owns the next step, and exceptions get attention before customers feel them.</p>
        </div>
        <div className="mt-12 grid gap-px bg-border md:grid-cols-2">
          {outcomes.map(({ icon: Icon, title, body }) => (
            <article key={title} className="bg-background p-7 md:p-9">
              <Icon className="mb-6 h-7 w-7 text-primary" />
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section id="services" className="border-y border-border bg-card/30 py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="section-label mb-4">// AUTOMATION_SERVICES</p>
            <h2 className="text-3xl font-bold md:text-5xl">Built around the work—not the latest tool.</h2>
          </div>
          <Link to="/audit" className="inline-flex items-center gap-2 font-mono text-sm text-primary hover:underline">Find the first workflow <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servicePages.map((service) => (
            <Link key={service.slug} to={`/services/${service.slug}`} className="group border border-border bg-background p-7 transition-colors hover:border-primary">
              <p className="font-mono text-xs text-primary">{service.eyebrow}</p>
              <h3 className="mt-4 text-xl font-semibold">{service.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm group-hover:text-primary">Explore service <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section id="process" className="py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-6">
        <p className="section-label mb-4">// FROM_BOTTLENECK_TO_BUILD</p>
        <h2 className="max-w-3xl text-3xl font-bold md:text-5xl">A controlled path to production.</h2>
        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {process.map(([number, title, body]) => (
            <article key={number} className="border-t border-primary pt-6">
              <span className="font-mono text-sm text-primary">{number}</span>
              <h3 className="mt-8 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 border border-border bg-card p-7 md:flex md:items-center md:justify-between md:p-10">
          <div className="flex max-w-3xl gap-4">
            <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-primary" />
            <div>
              <h3 className="text-xl font-semibold">Human judgment stays where it belongs.</h3>
              <p className="mt-2 text-muted-foreground">Permissions, validation, logs, exception queues, and approval steps are designed before launch—not added after something breaks.</p>
            </div>
          </div>
          <Link to="/audit" className="mt-6 inline-flex shrink-0 items-center gap-2 bg-primary px-6 py-3 font-semibold text-primary-foreground md:ml-8 md:mt-0">Get the free audit <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>

    <section id="arkansas" className="border-y border-border bg-card/30 py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="section-label mb-4">// ARKANSAS_AUTOMATION_PARTNER</p>
          <h2 className="text-3xl font-bold md:text-5xl">Local context. Production-grade systems.</h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">DREBUILDS serves Arkansas businesses from the River Valley to Central and Northwest Arkansas. Each local guide reflects the industries, workflows, and operating realities of that market.</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {locationPages.map((location) => (
            <Link key={location.slug} to={`/arkansas/${location.slug}`} className="group flex items-center justify-between border border-border bg-background p-5 hover:border-primary">
              <span className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" />{location.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section id="faq" className="py-24 md:py-32">
      <div className="container mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="section-label mb-4">// COMMON_QUESTIONS</p>
          <h2 className="text-3xl font-bold md:text-5xl">Clear answers before you automate.</h2>
          <p className="mt-5 text-muted-foreground">No vague transformation pitch. Start with the business process, the measurable outcome, and the safeguards.</p>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group py-6">
              <summary className="cursor-pointer list-none pr-8 text-lg font-semibold">{question}</summary>
              <p className="mt-4 leading-relaxed text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>

    <section className="border-y border-primary/30 bg-primary/10 py-16">
      <div className="container mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-xs text-primary">// NEXT_ACTION</p>
          <h2 className="mt-3 text-3xl font-bold">Find the workflow costing you the most time.</h2>
          <p className="mt-3 text-muted-foreground">The audit is free, practical, and designed for Arkansas operators.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/audit" className="inline-flex items-center justify-center gap-2 bg-primary px-6 py-3 font-semibold text-primary-foreground">Get my free automation audit <ArrowRight className="h-4 w-4" /></Link>
          <a href="tel:+14792210524" className="inline-flex items-center justify-center border border-border bg-background px-6 py-3 font-semibold">Call 479-221-0524</a>
        </div>
      </div>
    </section>
  </>
);
