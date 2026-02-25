"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import SignUp from "@/app/components/signup"
import { auth } from "@/app/lib/firebaseClient";

export default function Account() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/account/user");
      } else {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <main className="p-6">
        <p className="text-sm text-gray-600">読み込み中...</p>
      </main>
    );
  }
//<button className="mt-4 mx-auto px-2 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600">アカウント登録する</button>
  return (
    <main className="p-6">
      <div className="space-y-4">
      <section className="rounded-3xl bg-white p-8 shadow-sm border">
        <p>現在、さらに進んだ解析ができるように取り組んでいます。ベータ版が完成した時点でご連絡いたしますので、アカウント登録をおすすめします。</p>
      </section>
      <section className="rounded-3xl bg-white p-8 shadow-sm border">
        <SignUp />
      </section>
      </div>
    </main>
  );
}

/*
        <div className="text-center">
          <a
            href="/signUp"
            style={{
              display: "inline-block",
              marginTop: "2.5rem",
              color: isHovered ? "#1d4ed8" : "#2563eb",
              textUnderlineOffset: "4px",
              transition: "color 150ms ease",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            アカウントを登録
          </a>
        </div>
        */