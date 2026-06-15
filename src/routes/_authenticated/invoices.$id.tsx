import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/InvoiceForm";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  head: () => ({ meta: [{ title: "Edit invoice — BuildInvoice" }] }),
  component: EditInvoice,
});

function EditInvoice() {
  const { id } = Route.useParams();
  return <InvoiceForm invoiceId={id} />;
}
