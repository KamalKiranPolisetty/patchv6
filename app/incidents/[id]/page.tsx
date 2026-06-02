import AppShell from "@/components/AppShell";
import IncidentDetailClient from "@/components/IncidentDetailClient";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <IncidentDetailClient id={id} />
    </AppShell>
  );
}
