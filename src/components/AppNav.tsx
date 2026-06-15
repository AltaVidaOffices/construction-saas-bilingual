import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { HardHat, LogOut } from "lucide-react";

export function AppNav() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="bg-primary text-primary-foreground border-b border-primary/30">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
          <HardHat className="h-5 w-5 text-accent" />
          <span>{t("appName")}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="text-sm px-3 py-1.5 rounded hover:bg-primary-foreground/10"
            activeProps={{ className: "text-sm px-3 py-1.5 rounded bg-primary-foreground/15 font-medium" }}
          >
            {t("dashboard")}
          </Link>
          <div className="ml-2 flex rounded border border-primary-foreground/30 overflow-hidden text-xs">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 ${lang === "en" ? "bg-accent text-accent-foreground" : ""}`}
              aria-label="English"
            >EN</button>
            <button
              onClick={() => setLang("es")}
              className={`px-2 py-1 ${lang === "es" ? "bg-accent text-accent-foreground" : ""}`}
              aria-label="Español"
            >ES</button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-4 w-4 mr-1" />
            {t("logout")}
          </Button>
        </nav>
      </div>
    </header>
  );
}
