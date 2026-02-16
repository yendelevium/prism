"use client";

import { motion } from "framer-motion";
import {
  Play,
  CheckCircle2,
  XCircle,
  ArrowRight,
  CornerDownRight,
  SkipForward,
} from "lucide-react";

const steps = [
  {
    method: "POST",
    path: "/auth/login",
    status: "success",
    detail: "→ token",
    time: "89ms",
  },
  {
    method: "GET",
    path: "/api/user/profile",
    status: "success",
    detail: "→ user_id",
    time: "142ms",
  },
  {
    method: "PUT",
    path: "/api/user/settings",
    status: "success",
    detail: "",
    time: "283ms",
  },
  {
    method: "GET",
    path: "/api/notifications",
    status: "skipped",
    detail: "",
    time: "",
  },
  {
    method: "DELETE",
    path: "/api/session",
    status: "failed",
    detail: "",
    time: "502ms",
  },
];

const features = [
  "Drag-and-drop workflow editor",
  "JSONPath data extraction & chaining",
  "Assertion framework for every step",
  "Conditional skip logic",
  "Traffic replay from real traces",
  "Scheduled regression runs",
  "Export/import as JSON/YAML",
];

const WorkflowsPreview = () => {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_480px] gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-block text-sm font-medium text-primary mb-3 tracking-wide uppercase">
              Workflow Automation
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Chain requests.{" "}
              <span className="text-muted-foreground">Assert everything.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Build multi-step test scenarios that pass data between requests,
              run assertions, skip steps conditionally, and replay real user
              traces.
            </p>

            <ul className="space-y-3">
              {features.map((feature, i) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  {feature}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right: Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent blur-2xl" />
            <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden font-mono">
              {/* Header */}
              <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Play
                    className="w-3.5 h-3.5 text-primary"
                    fill="currentColor"
                  />
                  <span className="text-xs font-bold">User Login Flow</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground">
                    5 steps
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-destructive/15 text-destructive font-bold">
                    1 failed
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 relative">
                {steps.map((step, i) => (
                  <div key={i} className="relative">
                    {i < steps.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-[-16px] w-[1px] bg-border/40" />
                    )}
                    <div
                      className={`flex items-center gap-4 ${step.status === "skipped" ? "opacity-40" : ""}`}
                    >
                      <div className="relative z-10 flex items-center justify-center w-5 h-5 bg-card">
                        {step.status === "success" && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                        {step.status === "failed" && (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        {step.status === "skipped" && (
                          <SkipForward className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`${step.status === "failed" ? "text-destructive" : "text-muted-foreground"} font-bold`}
                          >
                            {step.method}
                          </span>
                          <span className="text-foreground/80">
                            {step.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground/50">
                          {step.detail && (
                            <span className="text-primary/60">
                              {step.detail}
                            </span>
                          )}
                          {step.time && <span>{step.time}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Vertical arrows indicator */}
                <div className="absolute left-[9px] top-10 flex flex-col gap-[38px] opacity-20">
                  {[1, 2, 3, 4].map((i) => (
                    <CornerDownRight
                      key={i}
                      className="w-2.5 h-2.5 rotate-45"
                    />
                  ))}
                </div>

                {/* Error Box */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 p-4 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div className="flex items-center gap-2 text-destructive mb-1 font-bold text-[11px]">
                    <XCircle className="w-3 h-3" />
                    Assertion Failed — Step 5
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-normal font-mono">
                    Expected: <span className="text-primary">200</span> • Got:{" "}
                    <span className="text-destructive">500</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowsPreview;
