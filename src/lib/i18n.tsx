import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "es";

const dict = {
  en: {
    appName: "BuildInvoice",
    tagline: "Invoicing built for contractors",
    // nav
    dashboard: "Dashboard",
    newInvoice: "New Invoice",
    logout: "Log out",
    // auth
    signIn: "Sign in",
    signUp: "Sign up",
    email: "Email",
    password: "Password",
    createAccount: "Create account",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    // dashboard
    totalInvoices: "Total invoices",
    totalRevenue: "Total revenue (paid)",
    outstanding: "Outstanding",
    search: "Search client or invoice #",
    status: "Status",
    all: "All",
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    noInvoices: "No invoices yet. Create your first one.",
    createInvoice: "Create invoice",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this invoice?",
    // invoice form
    invoiceDetails: "Invoice details",
    invoiceNumber: "Invoice #",
    invoiceDate: "Invoice date",
    dueDate: "Due date",
    clientInfo: "Client",
    clientName: "Client name",
    clientEmail: "Client email",
    clientAddress: "Client address",
    projectName: "Project",
    taxRate: "Tax rate (%)",
    notes: "Notes",
    lineItems: "Line items",
    description: "Description",
    quantity: "Qty",
    unitPrice: "Unit price",
    amount: "Amount",
    addLine: "Add line item",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    saveDraft: "Save as Draft",
    markSent: "Mark as Sent",
    markPaid: "Mark as Paid",
    downloadPdf: "Download PDF",
    preview: "Preview",
    back: "Back",
    saved: "Saved",
    error: "Something went wrong",
    invoice: "Invoice",
    billTo: "Bill to",
    thankYou: "Thank you for your business.",
  },
  es: {
    appName: "BuildInvoice",
    tagline: "Facturación para contratistas",
    dashboard: "Panel",
    newInvoice: "Nueva factura",
    logout: "Cerrar sesión",
    signIn: "Iniciar sesión",
    signUp: "Registrarse",
    email: "Correo",
    password: "Contraseña",
    createAccount: "Crear cuenta",
    haveAccount: "¿Ya tienes cuenta?",
    noAccount: "¿No tienes cuenta?",
    totalInvoices: "Facturas totales",
    totalRevenue: "Ingresos (pagados)",
    outstanding: "Pendiente",
    search: "Buscar cliente o # factura",
    status: "Estado",
    all: "Todas",
    draft: "Borrador",
    sent: "Enviada",
    paid: "Pagada",
    noInvoices: "Aún no hay facturas. Crea la primera.",
    createInvoice: "Crear factura",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar esta factura?",
    invoiceDetails: "Detalles de la factura",
    invoiceNumber: "# Factura",
    invoiceDate: "Fecha de factura",
    dueDate: "Fecha de vencimiento",
    clientInfo: "Cliente",
    clientName: "Nombre del cliente",
    clientEmail: "Correo del cliente",
    clientAddress: "Dirección del cliente",
    projectName: "Proyecto",
    taxRate: "Tasa de impuesto (%)",
    notes: "Notas",
    lineItems: "Conceptos",
    description: "Descripción",
    quantity: "Cant.",
    unitPrice: "Precio unitario",
    amount: "Importe",
    addLine: "Añadir concepto",
    subtotal: "Subtotal",
    tax: "Impuesto",
    total: "Total",
    saveDraft: "Guardar borrador",
    markSent: "Marcar enviada",
    markPaid: "Marcar pagada",
    downloadPdf: "Descargar PDF",
    preview: "Vista previa",
    back: "Volver",
    saved: "Guardado",
    error: "Algo salió mal",
    invoice: "Factura",
    billTo: "Facturar a",
    thankYou: "Gracias por su preferencia.",
  },
} as const;

export type TKey = keyof typeof dict["en"];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    if (stored === "en" || stored === "es") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (k: TKey) => dict[lang][k] ?? k;
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
