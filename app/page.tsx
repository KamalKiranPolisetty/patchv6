import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { kbExists } from "@/lib/kb";
import WorkspaceClient from "./WorkspaceClient";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const vdiKbAvailable = kbExists("VDI");

  return (
    <WorkspaceClient
      username={session.username || session.email.split("@")[0]}
      vdiKbAvailable={vdiKbAvailable}
    />
  );
}
