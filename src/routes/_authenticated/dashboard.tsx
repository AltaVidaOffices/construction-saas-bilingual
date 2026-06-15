import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, DollarSign, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BuildInvoice" }] }),
  component: Dashboard,
});

type Invoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  client_name: string;
  total: number;
  amount_paid: number;
  status: "draft" | "sent" | "paid";
};

function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date, client_name, total, amount_paid, status")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Invoice[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (q && !`${r.client_name} ${r.invoice_number}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, status]);

  const stats = useMemo(() => {
    const totalRevenue = rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.total), 0);
    const outstanding = rows.filter((r) => r.status === "sent").reduce((s, r) => s + Number(r.total) - Number(r.amount_paid), 0);
    return { count: rows.length, totalRevenue, outstanding };
  }, [rows]);

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard")}</h1>
        <Button onClick={() => navigate({ to: "/invoices/new" })} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-1" /> {t("createInvoice")}
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={<FileText />} label={t("totalInvoices")} value={String(stats.count)} />
        <StatCard icon={<DollarSign />} label={t("totalRevenue")} value={`$${stats.totalRevenue.toFixed(2)}`} />
        <StatCard icon={<Clock />} label={t("outstanding")} value={`$${stats.outstanding.toFixed(2)}`} />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="draft">{t("draft")}</SelectItem>
            <SelectItem value="sent">{t("sent")}</SelectItem>
            <SelectItem value="paid">{t("paid")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">{t("noInvoices")}</p>
            <Button onClick={() => navigate({ to: "/invoices/new" })} className="mt-4">
              <Plus className="h-4 w-4 mr-1" /> {t("createInvoice")}
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">{t("clientName")}</th>
                <th className="text-left p-3">{t("invoiceDate")}</th>
                <th className="text-right p-3">{t("total")}</th>
                <th className="text-left p-3">{t("status")}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/40">
                  <td className="p-3 font-mono">{r.invoice_number}</td>
                  <td className="p-3">{r.client_name}</td>
                  <td className="p-3">{r.invoice_date}</td>
                  <td className="p-3 text-right">${Number(r.total).toFixed(2)}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <Link to="/invoices/$id" params={{ id: r.id }}>
                      <Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded bg-primary/10 text-primary grid place-items-center">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-secondary text-secondary-foreground",
    paid: "bg-accent text-accent-foreground",
  };
  return <Badge className={map[status] || ""}>{t(status as "draft" | "sent" | "paid")}</Badge>;
}
