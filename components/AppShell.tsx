import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" data-testid="app-shell">
      <Header />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
