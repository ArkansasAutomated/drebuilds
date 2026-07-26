import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, MapPin, Phone, ShieldCheck } from "lucide-react";
import { FooterSection } from "@/components/sections/FooterSection";
import { locationPages, servicePages } from "@/data/seoPages";
import { usePageMeta } from "@/hooks/usePageMeta";

type SeoLandingProps = { type: "location" | "service" };

export default function SeoLanding({ type }: SeoLandingProps) {
  const { slug } = useParams();
  const pages = type === "location" ? locationPages : servicePages;
  const page = pages.find((item) => item.slug === slug);

  if (!page) return <Navigate to="/404" replace />;
  return <SeoLandingContent type={type} page={page} pages={pages} />;
}

function SeoLandingContent({ type, page, pages }: SeoLandingProps & { page: (typeof locationPages)[number]; pages: typeof locationPages }) {
  const path = type === "location" ? `/arkansas/${page.slug}` : `/services/${page.slug}`;
  const canonical = `https://www.drebuilds.online${path}`;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "DREBUILDS",
    url: canonical,
    telephone: "+1-479-221-0524",
    areaServed: type === "location" ? `${page.name}, Arkansas` : "Arkansas",
    description: page.description,
    serviceType: type === "location" ? "AI and workflow automation" : page.name,
  };

  usePageMeta({
    title: `${page.title} | DREBUILDS`,
    description: page.description,
    canonical,
    schema: [serviceSchema, faqSchema],
  });

  const related = pages.filter((item) => item.slug !== page.slug).slice(0, 4);

  return (
    <main className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-mono font-bold tracking-wider">DRE<span className="text-primary">BUILDS</span></Link>
          <div className="flex items-center gap-4">
            <a href="tel:+14792210524" className="hidden text-sm text-muted-foreground hover:text-primary sm:inline">479-221-0524</a>
            <Link to="/audit" className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Free audit</Link>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden border-b border-border py-20 md:py-28">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="container relative mx-auto max-w-6xl px-6">
          <p className="font-mono text-sm text-primary">{page.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">{page.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">{page.intro}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to={`/audit?source=${type}&topic=${page.slug}`} className="inline-flex items-center justify-center gap-2 bg-primary px-6 py-3 font-semibold text-primary-foreground">Get your free automation audit <ArrowRight className="h-4 w-4" /></Link>
            <a href="tel:+14792210524" className="inline-flex items-center justify-center gap-2 border border-border bg-background px-6 py-3 font-semibold"><Phone className="h-4 w-4" /> Talk with Dre</a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Arkansas-based</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Human-controlled systems</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Existing-tool friendly</span>
          </div>
        </div>
      </header>

      <section className="py-20 md:py-28">
        <div className="container mx-auto max-w-6xl px-6">
          <p className="section-label mb-4">// HIGH_VALUE_WORKFLOWS</p>
          <h2 className="max-w-3xl text-3xl font-bold md:text-5xl">Where automation creates practical leverage.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {page.workflows.map((workflow, index) => (
              <article key={workflow.title} className="border border-border bg-card p-7">
                <span className="font-mono text-xs text-primary">0{index + 1}</span>
                <h3 className="mt-6 text-xl font-semibold">{workflow.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{workflow.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/30 py-20">
        <div className="container mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="section-label mb-4">// LOCAL_OPERATING_CONTEXT</p>
            <h2 className="text-3xl font-bold">{type === "location" ? `Built for how ${page.name} teams work.` : "Designed for Arkansas operators."}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{page.localInsight}</p>
          </div>
          <div className="border border-border bg-background p-7">
            <h3 className="flex items-center gap-3 font-semibold"><MapPin className="h-5 w-5 text-primary" /> Commonly supported teams</h3>
            <ul className="mt-5 space-y-3">
              {page.sectors.map((sector) => <li key={sector} className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" />{sector}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="section-label mb-4">// QUESTIONS_ANSWERED</p>
            <h2 className="text-3xl font-bold md:text-4xl">What businesses ask before starting.</h2>
            <div className="mt-7 flex gap-3 border border-primary/30 bg-primary/10 p-5">
              <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">Every recommendation begins with process risk, data access, ownership, and a measurable definition of success.</p>
            </div>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {page.faq.map((item) => (
              <article key={item.question} className="py-6">
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-primary/30 bg-primary/10 py-14">
        <div className="container mx-auto flex max-w-6xl flex-col gap-7 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs text-primary">// START_WITH_THE_BOTTLENECK</p>
            <h2 className="mt-3 text-3xl font-bold">See what is worth automating first.</h2>
          </div>
          <Link to={`/audit?source=${type}&topic=${page.slug}`} className="inline-flex items-center justify-center gap-2 bg-primary px-6 py-3 font-semibold text-primary-foreground">Get the free audit <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="font-mono text-sm text-muted-foreground">Explore related {type === "location" ? "Arkansas markets" : "automation services"}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link key={item.slug} to={`${type === "location" ? "/arkansas" : "/services"}/${item.slug}`} className="flex items-center justify-between border border-border p-4 hover:border-primary">
                {item.name}<ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
