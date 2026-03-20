"use client";

import { useState } from "react";

interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  summary: React.ReactNode;
  children: React.ReactNode;
  glowColor?: "cyan" | "magenta" | "blue" | "amber";
  defaultOpen?: boolean;
}

export function CollapsibleCard({
  title,
  icon,
  summary,
  children,
  glowColor = "cyan",
  defaultOpen = false,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const glowClass = open ? `sg-glow-${glowColor}` : "";

  return (
    <div className={`sg-card ${glowClass} relative overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sg-cyan shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-sg-text-primary">{title}</h3>
          {!open && (
            <div className="text-xs text-sg-text-secondary mt-0.5 truncate">
              {summary}
            </div>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={`shrink-0 text-sg-text-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="sg-collapse-content" data-open={open}>
        <div className="sg-collapse-inner">
          <div className="px-4 pb-4 pt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
