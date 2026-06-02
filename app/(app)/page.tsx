import { redirect } from 'next/navigation';

// This route would conflict with app/page.tsx at URL path "/".
// Redirecting to home to avoid conflict issues.
// The actual homepage is app/page.tsx.
export default function AppGroupRootPage() {
  redirect('/');
}
