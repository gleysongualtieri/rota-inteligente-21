import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Upload } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const navegacao = [{ para: "/importacao" as const, rotulo: "Importação", icone: Upload }];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: {} });
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <div className="mr-auto">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Inteligência Logística CCPR
            </p>
            <p className="font-display text-lg font-bold leading-tight text-foreground">
              Simulador Operacional de Rota
            </p>
          </div>
          <nav className="flex items-center gap-1">
            {navegacao.map((item) => (
              <Link
                key={item.para}
                to={item.para}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              >
                <item.icone className="size-4" />
                {item.rotulo}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" onClick={sair}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
