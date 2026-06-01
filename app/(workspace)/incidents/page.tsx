import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getIncidentsByUser } from "@/lib/db";
import { IncidentsList } from "./IncidentsList";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const incidents = await getIncidentsByUser(user.id);
  return <IncidentsList incidents={incidents} />;
}
