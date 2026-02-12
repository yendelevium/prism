import { Zap } from "lucide-react";

const Footer = () => {
    return (
        <footer className="border-t border-border/40 bg-card/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
                            <Zap className="w-3 h-3 text-destructive-foreground" />
                        </div>
                        <span className="text-sm font-bold tracking-tight font-mono">
                            Pr<span className="text-gradient-primary">ism</span>
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                            The observability platform engineers deserve.
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        © 2026 Prism. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
