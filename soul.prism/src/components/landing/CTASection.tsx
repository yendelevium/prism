import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
    return (
        <section className="relative py-16 lg:py-20 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />

            <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4"
                >
                    Ready to replace your{" "}
                    <span className="text-gradient-primary">entire stack?</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.06 }}
                    className="text-muted-foreground mb-8 max-w-md mx-auto"
                >
                    Prism unifies API testing, distributed tracing, chaos engineering,
                    and workflow automation into one powerful platform.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.12 }}
                >
                    <Button size="lg" className="font-semibold text-base px-8 h-11 glow-primary">
                        Get Started Free <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;
