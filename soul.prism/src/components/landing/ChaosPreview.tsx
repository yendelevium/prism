import { motion } from "framer-motion";
import { AlertTriangle, Clock, WifiOff, Zap } from "lucide-react";

const chaosRules = [
    { pattern: "/api/checkout", type: "Error 500", status: "active", icon: AlertTriangle, color: "text-destructive" },
    { pattern: "/api/auth/*", type: "Latency +2s", status: "active", icon: Clock, color: "text-primary" },
    { pattern: "/api/inventory", type: "Drop Connection", status: "paused", icon: WifiOff, color: "text-muted-foreground" },
];

const ChaosPreview = () => {
    return (
        <section className="relative py-16 lg:py-24 overflow-hidden">
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-destructive/3 blur-[100px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    {/* Left — chaos panel */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="relative order-2 lg:order-1"
                    >
                        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-destructive/6 to-transparent blur-xl" />
                        <div className="relative rounded-xl border border-border bg-card overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/20">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-destructive" />
                                    <span className="text-xs font-mono font-semibold text-foreground">Chaos Rules Engine</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-destructive/15 text-destructive font-mono font-medium">
                                    2 Active
                                </span>
                            </div>

                            <div className="p-3.5 space-y-2">
                                {chaosRules.map((rule, i) => (
                                    <motion.div
                                        key={rule.pattern}
                                        initial={{ opacity: 0, y: 8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.2 + i * 0.08 }}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 border border-border/40"
                                    >
                                        <rule.icon className={`w-3.5 h-3.5 flex-shrink-0 ${rule.color}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-mono text-foreground/90 truncate">{rule.pattern}</p>
                                            <p className="text-[10px] text-muted-foreground">{rule.type}</p>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.status === "active" ? "bg-primary animate-pulse-glow" : "bg-muted-foreground/30"}`} />
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mx-3.5 mb-3.5 p-3 rounded-lg border border-border/40 bg-background/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono text-muted-foreground">Load Test — 100 concurrent</span>
                                    <span className="text-[10px] font-mono text-primary">Complete</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-foreground font-mono">142ms</p>
                                        <p className="text-[9px] text-muted-foreground">P50</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-foreground font-mono">891ms</p>
                                        <p className="text-[9px] text-muted-foreground">P99</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-destructive font-mono">2.3%</p>
                                        <p className="text-[9px] text-muted-foreground">Errors</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right content */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="order-1 lg:order-2"
                    >
                        <span className="inline-block text-sm font-medium text-destructive mb-2 tracking-wide uppercase">
                            Chaos Engineering
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                            Break things on purpose.{" "}
                            <span className="text-muted-foreground">Fix them before users notice.</span>
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-5">
                            Inject latency, force 500 errors, drop connections, and run concurrent load tests —
                            all tagged in traces so you know what's real and what's simulated.
                        </p>
                        <ul className="space-y-2">
                            {[
                                "Latency injection with trace tagging",
                                "Rule-based error injection (Regex URL)",
                                "Connection drop & timeout simulation",
                                "Load generation with P99 reports",
                                "Auto-mocking from trace responses",
                                "Failure impact analysis",
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-secondary-foreground">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ChaosPreview;
