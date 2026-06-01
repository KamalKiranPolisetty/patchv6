import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getKBStatusForCategory } from "@/lib/kb";
import { Workspace } from "./Workspace";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ incident?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const vdiStatus = await getKBStatusForCategory("VDI");

  return (
    <Workspace
      username={user.username}
      email={user.email}
      vdiKBStatus={vdiStatus}
      resumeIncidentId={params.incident ?? null}
    />
  );
}
