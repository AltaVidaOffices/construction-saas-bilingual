import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n, type Lang } from "@/lib/i18n";
import { toast } from "sonner";
import { Plus, Trash2, Download, ArrowLeft, Save } from "lucide-react";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LineItem = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
};

type Status = "draft" | "sent" | "paid";

export type InvoiceFormProps = { invoiceId?: string };

export function InvoiceForm({ invoiceId }: InvoiceFormProps) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!invoiceId);
  const [saving, setSaving] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [projectName, setProjectName] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("draft");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [companyName, setCompanyName] = useState<string | null>(null);

  // Load company name and (if editing) the invoice
  useEffect(() => {
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("company_name").maybeSingle();
      setCompanyName(prof?.company_name ?? null);

      if (invoiceId) {
        const { data: inv, error } = await supabase
          .from("invoices")
          .select("*, line_items(*)")
          .eq("id", invoiceId)
          .maybeSingle();
        if (error || !inv) {
          toast.error(error?.message || "Not found");
          navigate({ to: "/dashboard" });
          return;
        }
        setInvoiceNumber(inv.invoice_number);
        setInvoiceDate(inv.invoice_date);
        setDueDate(inv.due_date ?? "");
        setClientName(inv.client_name);
        setClientEmail(inv.client_email);
        setClientAddress(inv.client_address ?? "");
        setProjectName(inv.project_name ?? "");
        setTaxRate(Number(inv.tax_rate));
        setNotes(inv.notes ?? "");
        setStatus(inv.status as Status);
        const li = (inv.line_items as LineItem[] | undefined) ?? [];
        setItems(li.length
          ? li.map((x) => ({ id: x.id, description: x.description, quantity: Number(x.quantity), unit_price: Number(x.unit_price) }))
          : [{ description: "", quantity: 1, unit_price: 0 }]);
        setLoading(false);
      } else {
        // Get next invoice number
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: nextNum } = await supabase.rpc("next_invoice_number", { _user_id: user.id });
          if (nextNum) setInvoiceNumber(nextNum as string);
        }
      }
    })();
  }, [invoiceId, navigate]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
    const tax_amount = subtotal * (Number(taxRate) || 0) / 100;
    return { subtotal, tax_amount, total: subtotal + tax_amount };
  }, [items, taxRate]);

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }
  function addItem() { setItems((p) => [...p, { description: "", quantity: 1, unit_price: 0 }]); }
  function removeItem(i: number) { setItems((p) => p.length === 1 ? p : p.filter((_, idx) => idx !== i)); }

  async function save(newStatus?: Status): Promise<string | null> {
    if (!clientName.trim() || !clientEmail.trim()) {
      toast.error("Client name and email are required");
      return null;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        client_name: clientName,
        client_email: clientEmail,
        client_address: clientAddress || null,
        project_name: projectName || null,
        notes: notes || null,
        subtotal: totals.subtotal,
        tax_rate: taxRate,
        tax_amount: totals.tax_amount,
        total: totals.total,
        status: newStatus ?? status,
        language: lang as Lang,
        sent_at: newStatus === "sent" ? new Date().toISOString() : undefined,
        paid_at: newStatus === "paid" ? new Date().toISOString() : undefined,
      };

      let id = invoiceId;
      if (id) {
        const { error } = await supabase.from("invoices").update(payload).eq("id", id);
        if (error) throw error;
        await supabase.from("line_items").delete().eq("invoice_id", id);
      } else {
        const { data, error } = await supabase.from("invoices").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }

      const itemRows = items
        .filter((it) => it.description.trim() || it.unit_price > 0)
        .map((it, idx) => ({
          invoice_id: id!,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          amount: (it.quantity || 0) * (it.unit_price || 0),
          sort_order: idx,
        }));
      if (itemRows.length) {
        const { error } = await supabase.from("line_items").insert(itemRows);
        if (error) throw error;
      }

      if (newStatus) setStatus(newStatus);
      toast.success(t("saved"));
      return id!;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("error"));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    const id = await save("draft");
    if (id && !invoiceId) navigate({ to: "/invoices/$id", params: { id } });
  }

  async function handleDownload() {
    downloadInvoicePdf({
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      client_name: clientName,
      client_email: clientEmail,
      client_address: clientAddress || null,
      project_name: projectName || null,
      notes: notes || null,
      subtotal: totals.subtotal,
      tax_rate: taxRate,
      tax_amount: totals.tax_amount,
      total: totals.total,
      language: lang,
      company_name: companyName,
      items: items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        amount: (it.quantity || 0) * (it.unit_price || 0),
      })),
    });
  }

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={() => navigate({ to: "/dashboard" })} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleDownload}><Download className="h-4 w-4 mr-1" />{t("downloadPdf")}</Button>
          <Button variant="outline" onClick={() => save("sent")} disabled={saving}>{t("markSent")}</Button>
          <Button variant="outline" onClick={() => save("paid")} disabled={saving}>{t("markPaid")}</Button>
          <Button onClick={handleSaveDraft} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="h-4 w-4 mr-1" />{t("saveDraft")}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title={t("invoiceDetails")}>
          <Field label={t("invoiceNumber")}>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </Field>
          <Field label={t("invoiceDate")}>
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
          </Field>
          <Field label={t("dueDate")}>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label={t("status")}>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("draft")}</SelectItem>
                <SelectItem value="sent">{t("sent")}</SelectItem>
                <SelectItem value="paid">{t("paid")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title={t("clientInfo")}>
          <Field label={t("clientName")}>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </Field>
          <Field label={t("clientEmail")}>
            <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
          </Field>
          <Field label={t("clientAddress")}>
            <Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={2} />
          </Field>
          <Field label={t("projectName")}>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </Field>
        </Section>
      </div>

      <Section title={t("lineItems")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="text-left p-2">{t("description")}</th>
                <th className="text-right p-2 w-24">{t("quantity")}</th>
                <th className="text-right p-2 w-32">{t("unitPrice")}</th>
                <th className="text-right p-2 w-32">{t("amount")}</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2"><Input value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} /></td>
                  <td className="p-2"><Input type="number" step="0.01" value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} className="text-right" /></td>
                  <td className="p-2"><Input type="number" step="0.01" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} className="text-right" /></td>
                  <td className="p-2 text-right font-mono">${((it.quantity || 0) * (it.unit_price || 0)).toFixed(2)}</td>
                  <td className="p-2">
                    <Button size="sm" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" onClick={addItem} className="mt-3"><Plus className="h-4 w-4 mr-1" />{t("addLine")}</Button>
      </Section>

      <div className="grid md:grid-cols-2 gap-6">
        <Section title={t("notes")}>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} />
        </Section>

        <Section title={t("total")}>
          <div className="space-y-2">
            <Row label={t("subtotal")} value={`$${totals.subtotal.toFixed(2)}`} />
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground">{t("taxRate")}</Label>
              <Input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="w-24 text-right" />
            </div>
            <Row label={t("tax")} value={`$${totals.tax_amount.toFixed(2)}`} />
            <div className="border-t pt-2">
              <Row label={t("total")} value={`$${totals.total.toFixed(2)}`} bold />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-lg font-bold text-primary" : "text-sm"}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
