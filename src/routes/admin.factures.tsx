import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { DocumentList } from "@/components/admin/DocumentList";

export const Route = createFileRoute("/admin/factures")({
  component: FacturesLayout,
  head: () => ({ meta: [
    { title: "Factures — Admin ALU MED AMINE" },
    { name: "description", content: "Liste et édition des factures clients, suivi des paiements." },
    { name: "robots", content: "noindex" },
  ]}),
});

function FacturesLayout() {
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId === "/admin/factures/$id");
  if (hasChild) return <Outlet />;
  return <DocumentList kind="factures" />;
}
