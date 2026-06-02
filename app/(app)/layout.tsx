import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';
import Header from '@/components/Header';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  let incidentCount = 0;
  try {
    await connectDB();
    incidentCount = await Incident.countDocuments({ email: session.email });
  } catch {
    // DB might not be available
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header incidentCount={incidentCount} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
