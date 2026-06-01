import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PatchMark } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const params = await searchParams;

  return (
    <main
      data-testid="login-page"
      className="flex-1 min-h-[calc(100vh-0px)] w-full flex items-center justify-center bg-gray-50 px-4 py-12"
    >
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-6">
          <PatchMark size={48} className="shadow-sm" />
        </div>
        <Card padding="lg" className="w-full" data-testid="login-card">
          <h1 data-testid="login-heading" className="text-[26px] font-bold text-gray-900 text-center">
            Sign in to Patch
          </h1>
          <p className="text-center text-[13px] text-gray-500 mt-1.5 mb-6">
            Welcome back. Sign in to continue.
          </p>
          {params.registered ? (
            <div
              data-testid="login-success-banner"
              className="mb-4 rounded-md border border-green-200 bg-green-50 text-green-800 text-[13px] px-3 py-2"
            >
              Account created. Please sign in.
            </div>
          ) : null}
          <LoginForm />
        </Card>
        <p className="text-center text-[13px] text-gray-600 mt-5">
          Don&apos;t have an account?{" "}
          <Link
            data-testid="login-signup-link"
            href="/signup"
            className="text-patch-red font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
