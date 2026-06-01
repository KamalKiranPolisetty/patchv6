import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { getIncidentsByUser } from "@/lib/db";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const incidents = await getIncidentsByUser(user.id);

  return (
    <div data-testid="workspace-shell" className="flex flex-col flex-1 min-h-screen">
      <Header incidentCount={incidents.length} />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
