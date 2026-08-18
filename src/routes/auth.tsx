import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ redirecionar: z.string().optional() });

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Acesso — Simulador Operacional de Rota | CCPR" },
      {
        name: "description",
        content:
          "Área restrita do Simulador Operacional de Rota da CCPR: acesse para importar a roteirização e simular custos.",
      },
      { property: "og:title", content: "Acesso — Simulador Operacional de Rota | CCPR" },
      { property: "og:description", content: "Área restrita do Simulador Operacional de Rota da CCPR." },
    ],
  }),
  component: PaginaAuth,
});

function PaginaAuth() {
  const navigate = useNavigate();
  const { redirecionar } = useSearch({ from: "/auth" });
  const destino = redirecionar && redirecionar.startsWith("/") ? redirecionar : "/importacao";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: destino });
    });
  }, [destino, navigate]);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
      return;
    }
    navigate({ to: destino });
  }

  async function criarConta(evento: React.FormEvent) {
    evento.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: `${window.location.origin}/importacao` },
    });
    setCarregando(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    toast.success("Conta criada", { description: "Verifique seu e-mail se a confirmação estiver ativada." });
    navigate({ to: destino });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Inteligência Logística CCPR
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Simulador Operacional de Rota</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acesso</CardTitle>
            <CardDescription>Use seu e-mail corporativo para acessar os dados da sua unidade.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar">
              <TabsList className="w-full">
                <TabsTrigger className="flex-1" value="entrar">
                  Entrar
                </TabsTrigger>
                <TabsTrigger className="flex-1" value="criar">
                  Criar conta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entrar">
                <form className="space-y-4" onSubmit={entrar}>
                  <Campos email={email} senha={senha} setEmail={setEmail} setSenha={setSenha} />
                  <Button className="w-full" type="submit" disabled={carregando}>
                    {carregando ? "Entrando…" : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="criar">
                <form className="space-y-4" onSubmit={criarConta}>
                  <Campos email={email} senha={senha} setEmail={setEmail} setSenha={setSenha} />
                  <Button className="w-full" type="submit" disabled={carregando}>
                    {carregando ? "Criando…" : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Campos(props: {
  email: string;
  senha: string;
  setEmail: (v: string) => void;
  setSenha: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={props.email}
          onChange={(e) => props.setEmail(e.target.value)}
          placeholder="nome@ccpr.com.br"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={props.senha}
          onChange={(e) => props.setSenha(e.target.value)}
          placeholder="mínimo de 6 caracteres"
        />
      </div>
    </>
  );
}
