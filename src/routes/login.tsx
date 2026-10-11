import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { COMPANY } from "@/lib/format";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Connexion admin — ALU MED AMINE" }, { name: "robots", content: "noindex" }] }),
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const { session, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && isAdmin) navigate({ to: "/admin" });
  }, [session, isAdmin, navigate]);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    if (!email || password.length < 6) { toast.error("Email & mot de passe (6+ caractères) requis"); return; }
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Compte créé. Connexion…");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { toast.error("Email ou mot de passe incorrect"); return; }
      toast.success("Connecté");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-hero px-4">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Retour au site</Link>
        <h1 className="mt-4 font-display text-2xl font-bold">Connexion — {COMPANY.name}</h1>
        <p className="text-sm text-muted-foreground">Espace administrateur</p>
        <form onSubmit={handle} className="mt-6 grid gap-4">
          <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          <div className="grid gap-2"><Label htmlFor="password">Mot de passe</Label><Input id="password" name="password" type="password" required minLength={6} /></div>
          <Button type="submit" disabled={loading}>{loading ? "…" : mode === "signin" ? "Se connecter" : "Créer le compte admin"}</Button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "signin" ? "Premier accès ? Créer le compte admin" : "Déjà un compte ? Se connecter"}
        </button>
        <p className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          Le premier compte créé devient automatiquement administrateur.
        </p>
      </Card>
    </div>
  );
}
