import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { HardHat, FileText, Languages, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BuildInvoice — Bilingual invoicing for construction contractors" },
      { name: "description", content: "Create professional invoices in English or Spanish. Built for construction contractors, engineers, and concrete pros." },
      { property: "og:title", content: "BuildInvoice — Bilingual invoicing for contractors" },
      { property: "og:description", content: "Create professional invoices in English or Spanish. Built for construction contractors." },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <HardHat className="h-5 w-5 text-accent" />
            BuildInvoice
          </div>
          <Link to="/auth"><Button variant="secondary" size="sm">Sign in</Button></Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Invoicing built for <span className="text-primary">construction</span> pros
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Send polished invoices in English or Spanish. Track drafts, sent, and paid — all in one place.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link to="/auth"><Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">Get started free</Button></Link>
          <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-6 text-left">
          <Feature icon={<FileText />} title="Professional invoices" body="Auto-numbered, branded PDFs with line items, tax, and totals." />
          <Feature icon={<Languages />} title="English & Spanish" body="Toggle language anywhere — UI and generated PDFs both update." />
          <Feature icon={<Download />} title="Download or send" body="Save as draft, download PDF, mark as sent or paid." />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="h-10 w-10 rounded bg-primary/10 text-primary grid place-items-center mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
