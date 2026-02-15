"use client";

import { motion } from "framer-motion";
import { GitBranch, List, Clock, Filter, Layers } from "lucide-react";

const spans = [
  {
    name: "gateway.v1",
    duration: "1.2s",
    color: "bg-primary",
    width: "w-[100%]",
    delay: 0,
  },
  {
    name: "auth.service",
    duration: "240ms",
    color: "bg-primary/60",
    width: "w-[20%]",
    delay: 0.1,
  },
  {
    name: "inventory:get",
    duration: "890ms",
    color: "bg-destructive/80",
    width: "w-[74%]",
    delay: 0.2,
  },
  {
    name: "db.query",
    duration: "12ms",
    color: "bg-primary/40",
    width: "w-[5%]",
    delay: 0.3,
  },
  {
    name: "cache:hit",
    duration: "4ms",
    color: "bg-primary/30",
    width: "w-[2%]",
    delay: 0.4,
  },
];

const TracingPreview = () => {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent blur-2xl" />
            <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono font-bold">
                    Trace — abc-123-def
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-destructive/15 text-destructive font-mono">
                    CRITICAL
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                </div>
              </div>

              <div className="p-4 space-y-3">
                {spans.map((span, i) => (
                  <div key={span.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono px-1">
                      <span className="text-foreground/80">{span.name}</span>
                      <span className="text-muted-foreground/60">
                        {span.duration}
                      </span>
                    </div>
                    <div className="relative h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0, left: `${i * 10}%` }}
                        whileInView={{
                          width: span.width.replace("w-[", "").replace("]", ""),
                        }}
                        viewport={{ once: true }}
                        transition={{
                          delay: span.delay,
                          duration: 0.6,
                          ease: "easeOut",
                        }}
                        className={`absolute h-full ${span.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}

                <div className="mt-6 pt-4 border-t border-border/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Correlated Events
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-secondary/20 border border-border/20 text-[9px] font-mono text-muted-foreground">
                      <span className="text-primary/60">[LOG]</span> User
                      session validated (200 OK)
                    </div>
                    <div className="p-2 rounded bg-destructive/5 border border-destructive/10 text-[9px] font-mono text-destructive/80">
                      <span className="font-bold">[ERR]</span>{" "}
                      inventory_timeout: backend unreachable
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="order-1 lg:order-2"
          >
            <span className="inline-block text-sm font-medium text-primary mb-2 tracking-wide uppercase">
              Distributed Tracing
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Stop guessing.{" "}
              <span className="text-muted-foreground">
                Visualize your data.
              </span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Correlate every request with its underlying spans. Prism ingests
              OTLP data to show you exactly where the bottleneck is, across
              services and languages.
            </p>

            <ul className="space-y-4">
              {[
                {
                  title: "Deep Trace Analysis",
                  desc: "Correlate frontend requests to backend microservices automatically.",
                },
                {
                  title: "OTLP Native Ingestion",
                  desc: "Standard-compliant span collection with zero lock-in.",
                },
                {
                  title: "Waterfall Visualization",
                  desc: "Pinpoint latency spikes with high-resolution timing graphs.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TracingPreview;
