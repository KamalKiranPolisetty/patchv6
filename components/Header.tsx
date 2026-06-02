"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import PatchLogo from "./PatchLogo";

interface NavItemProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  active?: boolean;
  testId: string;
}

function NavItem({ href, onClick, children, active, testId }: NavItemProps) {
  const base =
    "flex items-center gap-1.5 px-1 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer relative";
  const underline = active
    ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#CC0000] after:rounded-full"
    : "";

  if (href) {
    return (
      <Link href={href} className={`${base} ${underline}`} data-testid={testId}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${base} ${underline}`} data-testid={testId}>
      {children}
    </button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [incidentCount, setIncidentCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/incidents/count")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.count != null) setIncidentCount(data.count); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleNewChat() {
    router.push(`/?newChat=${Date.now()}`);
  }

  return (
    <header
      className="w-full bg-white border-b border-gray-200 h-14 flex items-center px-6 shrink-0"
      data-testid="main-header"
      style={{ height: "56px" }}
    >
      {/* Left: Logo */}
      <Link href="/" className="flex items-center" data-testid="nav-logo-link">
        <PatchLogo size={32} showText textSize="text-lg" />
      </Link>

      {/* Right: Nav items */}
      <nav className="ml-auto flex items-center gap-6" data-testid="main-nav">
        <NavItem
          href="/incidents"
          active={pathname === "/incidents"}
          testId="nav-incidents-link"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1L2 14h12L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Incidents
          {incidentCount > 0 && (
            <span
              className="ml-1 inline-flex items-center justify-center bg-[#CC0000] text-white text-xs font-semibold rounded-full w-5 h-5"
              data-testid="nav-incidents-badge"
            >
              {incidentCount > 99 ? "99+" : incidentCount}
            </span>
          )}
        </NavItem>

        <NavItem onClick={handleNewChat} testId="nav-new-chat-btn">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 2h12v9H9l-3 3V11H2V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M8 5v4M6 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New Chat
        </NavItem>

        <NavItem onClick={handleLogout} testId="nav-logout-btn">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2H2v12h4M10 5l3 3-3 3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </NavItem>
      </nav>
    </header>
  );
}
