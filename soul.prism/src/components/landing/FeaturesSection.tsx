import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    GitBranch,
    Flame,
    Workflow,
    Activity,
    Shield,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const features = [
    {
        icon: Send,
        title: "Core Request Engine",
        description:
            "Build GET/POST requests with custom headers, bodies, and environment variables. Supports REST, GraphQL, and gRPC protocols with organized collections and request history.",
        highlights: ["URL bar & method selector", "{{variable}} interpolation", "Collections & history", "Metadata capture"],
    },
    {
        icon: GitBranch,
        title: "Distributed Tracing",
        description:
            "Ingest OpenTelemetry spans via OTLP, correlate traces to requests, and visualize waterfalls, service maps, and span drill-downs with advanced filtering.",
        highlights: ["OTLP ingestion", "Waterfall & service map", "Span drill-down", "Threshold alerts"],
    },
    {
        icon: Flame,
        title: "Chaos Engineering",
        description:
            "Inject latency, force errors, drop connections, run stress tests, and auto-mock responses. Analyze failure impact across your service dependency graph.",
        highlights: ["Latency & error injection", "Load generation (P99)", "Auto-mocking", "Impact analysis"],
    },
    {
        icon: Workflow,
        title: "Workflow Automation",
        description:
            "Chain requests into multi-step scenarios with JSONPath data passing, assertions, conditional skip logic, trace replay, and scheduled regression runs.",
        highlights: ["Drag-and-drop editor", "Data chaining", "Conditional logic", "Scheduled runs"],
    },
    {
        icon: Shield,
        title: "Infrastructure & Security",
        description:
            "JWT auth with RBAC, team workspaces, Docker/K8s deployment, CI/CD CLI integration, data retention policies, and automatic sensitive data redaction.",
        highlights: ["Auth & RBAC", "Team workspaces", "CI/CD hooks", "Privacy redaction"],
    },
    {
        icon: Activity,
        title: "Analytics Dashboard",
        description:
            "Global health scores, status code distribution, latency trends, top failing endpoints, request volume analytics, and exportable CSV/PDF reports.",
        highlights: ["Health score", "Latency trends (P95)", "Failing endpoints", "Report export"],
    },
];

// Positions for the fanned-out cards (like the reference image)
// Center card is front, left/right cards peek out behind with rotation
const cardConfigs = [
    // far left (behind)
    { x: -320, rotate: -8, scale: 0.85, opacity: 0.3, z: 1 },
    // left (visible behind)
    { x: -160, rotate: -4, scale: 0.92, opacity: 0.6, z: 2 },
    // center (active)
    { x: 0, rotate: 0, scale: 1, opacity: 1, z: 3 },
    // right (visible behind)
    { x: 160, rotate: 4, scale: 0.92, opacity: 0.6, z: 2 },
    // far right (behind)
    { x: 320, rotate: 8, scale: 0.85, opacity: 0.3, z: 1 },
];

const FeaturesSection = () => {
    const [current, setCurrent] = useState(0);

    const goTo = (dir: number) => {
        setCurrent((prev) => (prev + dir + features.length) % features.length);
    };

    const getVisibleCards = () => {
        const cards: { feature: typeof features[0]; index: number; config: typeof cardConfigs[0] }[] = [];
        for (let offset = -2; offset <= 2; offset++) {
            const idx = (current + offset + features.length) % features.length;
            cards.push({
                feature: features[idx],
                index: idx,
                config: cardConfigs[offset + 2],
            });
        }
        return cards;
    };

    return (
        <section className="relative py-16 lg:py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block text-sm font-medium text-primary mb-3 tracking-wide uppercase"
                    >
                        Platform Capabilities
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05 }}
                        className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
                    >
                        Six modules.{" "}
                        <span className="text-muted-foreground">One unified platform.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground text-lg"
                    >
                        Prism unifies API testing, distributed tracing, chaos engineering, and
                        workflow automation into one powerful platform.
                    </motion.p>
                </div>

                {/* Fanned card stack */}
                <div className="relative flex items-center justify-center">
                    {/* Left arrow */}
                    <button
                        onClick={() => goTo(-1)}
                        className="absolute left-0 sm:left-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border border-border bg-card/90 backdrop-blur hover:bg-secondary/60 transition-colors"
                        aria-label="Previous feature"
                    >
                        <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>

                    {/* Cards container */}
                    <div className="relative w-full max-w-xl h-[320px] sm:h-[300px]" style={{ perspective: "1200px" }}>
                        {getVisibleCards().map(({ feature, index, config }) => {
                            const Icon = feature.icon;
                            const isActive = config.z === 3;

                            return (
                                <motion.div
                                    key={feature.title}
                                    animate={{
                                        x: config.x,
                                        rotate: config.rotate,
                                        scale: config.scale,
                                        opacity: config.opacity,
                                        zIndex: config.z,
                                    }}
                                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                    className="absolute inset-0 mx-auto w-[90%] sm:w-[440px] rounded-xl border border-border bg-card shadow-xl"
                                    style={{ originX: 0.5, originY: 1 }}
                                >
                                    <div className="p-6 sm:p-8 h-full flex flex-col">
                                        <div className="flex items-start gap-4">
                                            <div className="w-11 h-11 flex-shrink-0 bg-primary/10 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-foreground mb-2">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                                    {feature.description}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {feature.highlights.map((h) => (
                                                        <span
                                                            key={h}
                                                            className="text-[10px] px-2 py-0.5 bg-secondary/60 text-muted-foreground font-mono border border-border/40"
                                                        >
                                                            {h}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-3 flex justify-end">
                                            <span className="text-xs font-mono text-muted-foreground/40">
                                                {index + 1} / {features.length}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Right arrow */}
                    <button
                        onClick={() => goTo(1)}
                        className="absolute right-0 sm:right-4 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border border-border bg-card/90 backdrop-blur hover:bg-secondary/60 transition-colors"
                        aria-label="Next feature"
                    >
                        <ChevronRight className="w-5 h-5 text-foreground" />
                    </button>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {features.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`w-2 h-2 transition-colors ${i === current ? "bg-primary" : "bg-border"}`}
                            aria-label={`Go to feature ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
