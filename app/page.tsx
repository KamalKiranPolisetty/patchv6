import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { kbFileExists } from "@/lib/kb";
import MainPageClient from "./MainPageClient";

interface Props {
  searchParams: Promise<{ resume?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const resumeId = params.resume;

  const vdiAvailable = kbFileExists("vdi");
  const tiles = [
    { name: "VDI", kbAvailable: vdiAvailable },
  ];

  const username = session.username || session.email.split("@")[0];

  return <MainPageClient username={username} tiles={tiles} initialIncidentId={resumeId} />;
}
