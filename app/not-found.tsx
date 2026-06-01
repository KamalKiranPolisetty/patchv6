import Link from "next/link";
import { PatchMark } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main
      data-testid="not-found-page"
      className="flex-1 min-h-[calc(100vh-0px)] w-full flex items-center justify-center bg-gray-50 px-4"
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <PatchMark size={48} className="shadow-sm" />
        </div>
        <h1 data-testid="not-found-heading" className="text-[24px] font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-[13px] text-gray-500 mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          data-testid="not-found-home-link"
          className="text-patch-red font-semibold hover:underline"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
