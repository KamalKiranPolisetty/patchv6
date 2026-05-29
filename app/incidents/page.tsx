import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import IncidentsListClient from "./IncidentsListClient";

export default async function IncidentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <IncidentsListClient username={session.username} />;
}
