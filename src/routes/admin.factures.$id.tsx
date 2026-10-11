import { createFileRoute } from "@tanstack/react-router";
import { DocumentEditor } from "@/components/admin/DocumentEditor";

export const Route = createFileRoute("/admin/factures/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <DocumentEditor kind="facture" id={id} />;
  },
});
