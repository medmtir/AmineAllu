import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { DocumentList } from "@/components/admin/DocumentList";

export const Route = createFileRoute("/admin/devis")({
  component: DevisLayout,
  head: () => ({ meta: [
    { title: "Devis — Admin ALU MED AMINE" },
    { name: "description", content: "Liste et édition des devis clients." },
    { name: "robots", content: "noindex" },
  ]}),
});

function DevisLayout() {
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId === "/admin/devis/$id");
  if (hasChild) return <Outlet />;
  return <DocumentList kind="devis" />;
}
