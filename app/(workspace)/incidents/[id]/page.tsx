import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getIncidentById } from "@/lib/db";
import { IncidentDetail } from "./IncidentDetail";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const incident = await getIncidentById(id);
  if (!incident || incident.userId !== user.id) notFound();

  return <IncidentDetail incident={incident} />;
}
