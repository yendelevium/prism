"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          // Core Nord Background & Text
          backgroundColor: "#434C5E",
          color: "#ECEFF4",
          border: "1px solid #4C566A",
          borderRadius: "8px",
        },
        classNames: {
          // Success: Nord Green
          success: "!bg-[#A3BE8C] !text-[#2E3440] !border-[#A3BE8C]",
          // Error: Nord Red
          error: "!bg-[#BF616A] !text-[#ECEFF4] !border-[#BF616A]",
          // Warning: Nord Yellow
          warning: "!bg-[#EBCB8B] !text-[#2E3440] !border-[#EBCB8B]",
          // Info/Action: Nord Cyan
          info: "!bg-[#88C0D0] !text-[#2E3440] !border-[#88C0D0]",
          description: "group-[.toast]:text-[#D8DEE9] opacity-90",
          actionButton:
            "group-[.toast]:bg-[#2E3440] group-[.toast]:text-[#ECEFF4]",
          cancelButton:
            "group-[.toast]:bg-[#3B4252] group-[.toast]:text-[#ECEFF4]",
        },
      }}
    />
  );
}
