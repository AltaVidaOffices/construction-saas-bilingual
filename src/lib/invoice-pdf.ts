import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Lang } from "./i18n";

export type PdfInvoice = {
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  client_name: string;
  client_email: string;
  client_address: string | null;
  project_name: string | null;
  notes: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  language: Lang;
  company_name: string | null;
  items: { description: string; quantity: number; unit_price: number; amount: number }[];
};

const labels = {
  en: {
    invoice: "INVOICE", number: "Invoice #", date: "Date", due: "Due", billTo: "Bill to",
    project: "Project", description: "Description", qty: "Qty", price: "Unit price",
    amount: "Amount", subtotal: "Subtotal", tax: "Tax", total: "Total", notes: "Notes",
    thanks: "Thank you for your business.",
  },
  es: {
    invoice: "FACTURA", number: "# Factura", date: "Fecha", due: "Vence", billTo: "Facturar a",
    project: "Proyecto", description: "Descripción", qty: "Cant.", price: "Precio unitario",
    amount: "Importe", subtotal: "Subtotal", tax: "Impuesto", total: "Total", notes: "Notas",
    thanks: "Gracias por su preferencia.",
  },
} as const;

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function generateInvoicePdf(inv: PdfInvoice): jsPDF {
  const L = labels[inv.language] ?? labels.en;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;

  // Header band
  doc.setFillColor(44, 82, 130); // navy
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(inv.company_name || "BuildInvoice", M, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(L.invoice, M, 70);

  // Invoice meta (right)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${L.number}: ${inv.invoice_number}`, W - M, 50, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${L.date}: ${inv.invoice_date}`, W - M, 66, { align: "right" });
  if (inv.due_date) doc.text(`${L.due}: ${inv.due_date}`, W - M, 80, { align: "right" });

  // Bill to
  doc.setTextColor(15, 23, 42);
  let y = 130;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(L.billTo, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 16;
  doc.text(inv.client_name, M, y); y += 14;
  doc.text(inv.client_email, M, y); y += 14;
  if (inv.client_address) {
    inv.client_address.split("\n").forEach((line) => { doc.text(line, M, y); y += 14; });
  }
  if (inv.project_name) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text(`${L.project}:`, M, y);
    doc.setFont("helvetica", "normal");
    doc.text(inv.project_name, M + 60, y);
  }

  // Items table
  autoTable(doc, {
    startY: y + 24,
    head: [[L.description, L.qty, L.price, L.amount]],
    body: inv.items.map((it) => [it.description, it.quantity.toString(), fmt(it.unit_price), fmt(it.amount)]),
    headStyles: { fillColor: [44, 82, 130], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 1: { halign: "right", cellWidth: 50 }, 2: { halign: "right", cellWidth: 90 }, 3: { halign: "right", cellWidth: 90 } },
    margin: { left: M, right: M },
  });

  // @ts-expect-error lastAutoTable injected by autotable
  const tableEnd: number = doc.lastAutoTable.finalY + 16;
  const totalsX = W - M;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${L.subtotal}: ${fmt(inv.subtotal)}`, totalsX, tableEnd, { align: "right" });
  doc.text(`${L.tax} (${inv.tax_rate}%): ${fmt(inv.tax_amount)}`, totalsX, tableEnd + 16, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(44, 82, 130);
  doc.text(`${L.total}: ${fmt(inv.total)}`, totalsX, tableEnd + 36, { align: "right" });

  // Notes
  if (inv.notes) {
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(L.notes, M, tableEnd + 36);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(inv.notes, W - M * 2);
    doc.text(lines, M, tableEnd + 52);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(L.thanks, W / 2, doc.internal.pageSize.getHeight() - 30, { align: "center" });

  return doc;
}

export function downloadInvoicePdf(inv: PdfInvoice) {
  const doc = generateInvoicePdf(inv);
  doc.save(`${inv.invoice_number}.pdf`);
}
