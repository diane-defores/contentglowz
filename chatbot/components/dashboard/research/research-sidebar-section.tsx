"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface ResearchSidebarSectionProps {
  icon: ReactNode;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function ResearchSidebarSection({
  icon,
  title,
  collapsed,
  onToggle,
  children,
}: ResearchSidebarSectionProps) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="sticky top-0 z-10 -mx-2 mb-1 flex w-[calc(100%+16px)] items-center gap-2 border-y border-transparent bg-gradient-to-b from-background to-background/70 px-2 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground backdrop-blur hover:text-foreground transition-colors"
        aria-expanded={!collapsed}
      >
        <span className="mr-1" aria-hidden>
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className="opacity-70" aria-hidden>
            {icon}
          </span>
          {title}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-0.5 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
