import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Terminal,
  Send,
  GitBranch,
  Flame,
  Workflow,
  Activity,
  Shield,
} from "lucide-react";

const modules = [
  { icon: Send, label: "Requests" },
  { icon: GitBranch, label: "Tracing" },
  { icon: Flame, label: "Chaos" },
  { icon: Workflow, label: "Workflows" },
  { icon: Shield, label: "Security" },
  { icon: Activity, label: "Analytics" },
];

const stats = [
  { value: "3+", label: "Protocols", detail: "REST, GraphQL, gRPC" },
  { value: "10K+", label: "Trace Ingestion", detail: "spans/sec via OTLP" },
  {
    value: "5",
    label: "Chaos Modes",
    detail: "Latency, Error, Drop, Load, Mock",
  },
  { value: "42", label: "User Stories", detail: "Across 6 integrated epics" },
];

const HeroSection = () => {
  return (
    <section className="relative pt-24 pb-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-dot-grid opacity-20" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/4 blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top — centered headline area */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/5 text-sm text-primary"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            Now in Beta
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5"
          >
            The Observability Platform{" "}
            <span className="text-gradient-primary">Engineers Deserve</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
          >
            Send requests, trace distributed systems, inject chaos, and automate
            workflows — all from one powerful interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              className="font-semibold text-base px-8 h-12 glow-primary"
            >
              Start Free <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>

        {/* Module pills — horizontal row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10"
        >
          {modules.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 + i * 0.05 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 bg-card/50 text-xs text-muted-foreground font-mono hover:border-primary/30 hover:text-foreground transition-colors cursor-default"
            >
              <m.icon className="w-3.5 h-3.5 text-primary" />
              {m.label}
            </motion.div>
          ))}
        </motion.div>

        {/* Terminal Preview — full width */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative max-w-4xl mx-auto mb-14"
        >
          <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-destructive/5 blur-2xl" />
          <div className="relative rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/20" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 px-3 py-0.5 rounded-md bg-secondary/50 text-[11px] text-muted-foreground font-mono">
                  <Terminal className="w-3 h-3" />
                  Prism — Request Builder
                </div>
              </div>
            </div>

            {/* Terminal content — two columns */}
            <div className="grid md:grid-cols-[1fr_1px_1fr]">
              {/* Left: Request */}
              <div className="p-5 font-mono text-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-primary/15 text-primary text-xs font-bold">
                    GET
                  </span>
                  <div className="flex-1 px-3 py-1.5 rounded-md bg-secondary/50 text-muted-foreground border border-border/50 text-xs truncate">
                    https://api.example.com/v1/users
                  </div>
                  <span className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    Send
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <span className="w-16 text-right text-muted-foreground/40">
                      Header
                    </span>
                    <span className="text-primary/70">Authorization</span>
                    <span className="text-muted-foreground/30">:</span>
                    <span className="text-muted-foreground truncate">
                      Bearer {"{{token}}"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <span className="w-16 text-right text-muted-foreground/40">
                      Header
                    </span>
                    <span className="text-primary/70">Content-Type</span>
                    <span className="text-muted-foreground/30">:</span>
                    <span className="text-muted-foreground">
                      application/json
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <span className="w-16 text-right text-muted-foreground/40">
                      Env
                    </span>
                    <span className="text-primary/70">{"{{base_url}}"}</span>
                    <span className="text-muted-foreground/30">=</span>
                    <span className="text-muted-foreground truncate">
                      api.example.com
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block bg-border/50" />

              {/* Right: Response */}
              <div className="p-5 font-mono text-sm border-t md:border-t-0 border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                    Response
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary font-medium">
                      200 OK
                    </span>
                    <span className="text-[10px] text-muted-foreground/40">
                      432ms
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-background/60 border border-border/30 p-3.5 text-xs leading-relaxed">
                  <span className="text-muted-foreground">{"{"}</span>
                  <br />
                  <span className="text-muted-foreground pl-4">"status"</span>
                  <span className="text-muted-foreground/50">: </span>
                  <span className="text-primary">"ok"</span>
                  <span className="text-muted-foreground/50">,</span>
                  <br />
                  <span className="text-muted-foreground pl-4">"trace_id"</span>
                  <span className="text-muted-foreground/50">: </span>
                  <span className="text-primary">"abc-123-def-456"</span>
                  <span className="text-muted-foreground/50">,</span>
                  <br />
                  <span className="text-muted-foreground pl-4">"users"</span>
                  <span className="text-muted-foreground/50">: </span>
                  <span className="text-muted-foreground">{"[{ ... }]"}</span>
                  <br />
                  <span className="text-muted-foreground">{"}"}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats — inline below terminal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.06 }}
              className="text-center p-4 rounded-xl border border-border/30 bg-card/30 hover:bg-card/60 hover:border-primary/20 transition-all"
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-gradient-primary mb-1 font-mono">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-foreground mb-0.5">
                {stat.label}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {stat.detail}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
