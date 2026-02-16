"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  MousePointer2,
  Clock,
  Globe,
} from "lucide-react";

const stats = [
  {
    label: "Health Score",
    value: "94.2%",
    sub: "+1.3%",
    icon: Activity,
    color: "text-primary",
  },
  {
    label: "Avg Latency",
    value: "187 ms",
    sub: "-12ms",
    icon: TrendingUp,
    color: "text-primary",
  },
  {
    label: "Error Rate",
    value: "1.8%",
    sub: "+0.4%",
    icon: AlertTriangle,
    color: "text-destructive",
  },
  {
    label: "Request Vol",
    value: "24.3K",
    unit: "/hr",
    sub: "+8.2%",
    icon: Globe,
    color: "text-primary",
  },
];

const endpoints = [
  { id: 1, method: "POST", path: "/api/checkout", rate: "4.7%", time: "1.2s" },
  {
    id: 2,
    method: "GET",
    path: "/api/inventory/search",
    rate: "3.1%",
    time: "890ms",
  },
  {
    id: 3,
    method: "PUT",
    path: "/api/cart/update",
    rate: "2.8%",
    time: "650ms",
  },
  {
    id: 4,
    method: "DELETE",
    path: "/api/session",
    rate: "1.9%",
    time: "420ms",
  },
];

const AnalyticsPreview = () => {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-sm font-medium text-primary mb-3 tracking-wide uppercase"
          >
            Analytics Dashboard
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Insights that drive action.{" "}
            <span className="text-muted-foreground">Not just data.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg leading-relaxed"
          >
            Health scores, latency trends, error distribution, top failing
            endpoints — export as CSV/PDF and share with your team.
          </motion.p>
        </div>

        {/* Dashboard UI */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-5xl mx-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden font-mono"
        >
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-border bg-secondary/20 flex items-center justify-between">
            <span className="text-xs font-bold">Observability Dashboard</span>
            <div className="flex gap-2">
              <span className="text-[10px] px-3 py-1 rounded bg-secondary/50 text-muted-foreground">
                Last 24h
              </span>
              <span className="text-[10px] px-3 py-1 rounded bg-secondary/50 text-muted-foreground">
                All Services
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-xl border border-border/50 bg-secondary/10"
                >
                  <div className="flex items-center justify-between mb-3 text-muted-foreground/60">
                    <span className="text-[10px] uppercase font-bold">
                      {stat.label}
                    </span>
                    <stat.icon className="w-3 h-3" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-xl font-bold tracking-tight">
                      {stat.value}
                      {stat.unit && (
                        <span className="text-xs font-normal opacity-40 ml-1">
                          {stat.unit}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold ${stat.sub.startsWith("+") ? "text-primary" : "text-primary"}`}
                    >
                      {stat.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row: Chart & List */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Latency Chart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Latency Trend (P95)
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-50">
                    Avg: 187ms
                  </span>
                </div>
                <div className="h-32 flex items-end gap-1.5 p-1">
                  {[
                    40, 55, 30, 60, 45, 80, 70, 95, 85, 40, 60, 75, 50, 65, 80,
                    45,
                  ].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.03, duration: 0.5 }}
                      className={`flex-1 rounded-sm ${h > 75 ? "bg-destructive/60" : "bg-primary/20"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Endpoints List */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase px-1">
                  Top Failing Endpoints
                </span>
                <div className="space-y-2">
                  {endpoints.map((ep) => (
                    <div
                      key={ep.id}
                      className="group flex items-center justify-between p-3 rounded-lg border border-border/40 bg-secondary/10 hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[9px] text-muted-foreground/30">
                          {ep.id}.
                        </span>
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-[9px] font-bold ${ep.method === "POST" ? "text-primary/60" : "text-muted-foreground/50"}`}
                          >
                            {ep.method}
                          </span>
                          <span className="text-[10px] truncate max-w-[140px] text-foreground/80">
                            {ep.path}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold">
                        <span className="text-destructive font-mono">
                          {ep.rate}
                        </span>
                        <span className="text-muted-foreground/40 font-mono w-12 text-right">
                          {ep.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AnalyticsPreview;
