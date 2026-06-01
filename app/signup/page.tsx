import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PatchMark } from "@/components/ui/Logo";
import { SignupForm } from "./SignupForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main
      data-testid="signup-page"
      className="flex-1 min-h-[calc(100vh-0px)] w-full flex items-center justify-center bg-gray-50 px-4 py-12"
    >
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-6">
          <PatchMark size={48} className="shadow-sm" />
        </div>
        <Card padding="lg" className="w-full" data-testid="signup-card">
          <h1 data-testid="signup-heading" className="text-[26px] font-bold text-gray-900 text-center">
            Create your account
          </h1>
          <p className="text-center text-[13px] text-gray-500 mt-1.5 mb-6">
            Get started with Patch in just a few seconds.
          </p>
          <SignupForm />
        </Card>
        <p className="text-center text-[13px] text-gray-600 mt-5">
          Already have an account?{" "}
          <Link
            data-testid="signup-signin-link"
            href="/login"
            className="text-patch-red font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
