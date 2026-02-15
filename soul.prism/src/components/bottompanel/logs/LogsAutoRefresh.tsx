"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogsAutoRefresh({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, 3000); // 2–5s is ideal

    return () => clearInterval(id);
  }, [router]);

  return <>{children}</>;
}
