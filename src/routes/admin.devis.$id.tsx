import { createFileRoute } from "@tanstack/react-router";
import { DocumentEditor } from "@/components/admin/DocumentEditor";

export const Route = createFileRoute("/admin/devis/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <DocumentEditor kind="devis" id={id} />;
  },
});
