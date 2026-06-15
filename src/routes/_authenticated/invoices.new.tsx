import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/InvoiceForm";

export const Route = createFileRoute("/_authenticated/invoices/new")({
  head: () => ({ meta: [{ title: "New invoice — BuildInvoice" }] }),
  component: () => <InvoiceForm />,
});
