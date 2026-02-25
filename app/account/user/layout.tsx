"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebaseClient";

export default function AccountUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        const redirectTo = `/signIn?next=${encodeURIComponent(pathname || "/account/user")}`;
        router.replace(redirectTo);
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (checking) {
    return (
      <main className="p-6">
        <p className="text-sm text-gray-600">認証状態を確認中...</p>
      </main>
    );
  }

  return <>{children}</>;
}
