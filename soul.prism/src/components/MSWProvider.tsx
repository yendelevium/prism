"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    // Only mount MSW if test routes are explicitly enabled (i.e. we are in E2E mode)
    if (process.env.NEXT_PUBLIC_ENABLE_MSW === "true") {
      import("@/mocks/browser").then(({ worker }) => {
        worker.start({ onUnhandledRequest: "bypass" }).then(() => setMswReady(true));
      });
    } else {
      setMswReady(true);
    }
  }, []);

  if (!mswReady) return null; // Wait to render children until MSW is active to prevent racing early network calls
  
  return <>{children}</>;
}
