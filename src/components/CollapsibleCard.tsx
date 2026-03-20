'use client';

import { useState, useRef, useEffect } from 'react';

interface CollapsibleCardProps {
  title: string;
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: 'cyan' | 'magenta' | 'blue' | 'amber';
  icon?: React.ReactNode;
  className?: string;
}

const ACCENT_STYLES = {
  cyan:    { border: 'rgba(0,255,242,0.25)',  text: '#00fff2', glow: 'rgba(0,255,242,0.06)' },
  magenta: { border: 'rgba(255,0,255,0.25)',  text: '#ff00ff', glow: 'rgba(255,0,255,0.06)' },
  blue:    { border: 'rgba(77,124,255,0.25)', text: '#4d7cff', glow: 'rgba(77,124,255,0.06)' },
  amber:   { border: 'rgba(255,184,0,0.25)',  text: '#ffb800', glow: 'rgba(255,184,0,0.06)' },
};

export function CollapsibleCard({
  title,
  summary,
  children,
  defaultOpen = false,
  accentColor = 'cyan',
  icon,
  className = '',
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const accent = ACCENT_STYLES[accentColor];

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  // Measure on toggle open
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Use a small delay to let content render
      const timeout = setTimeout(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight);
        }
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  return (
    <div
      className={`sg-card rounded-xl overflow-hidden transition-all duration-300 ${className}`}
      style={{
        borderColor: accent.border,
        boxShadow: `0 0 20px ${accent.glow}, inset 0 1px 0 ${accent.border}`,
      }}
    >
      {/* Header / Toggle Button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 active:opacity-70"
        style={{ background: isOpen ? `${accent.glow}` : 'transparent' }}
        aria-expanded={isOpen}
      >
        {/* Icon */}
        {icon && (
          <span className="flex-shrink-0" style={{ color: accent.text }}>
            {icon}
          </span>
        )}

        {/* Title + Summary */}
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-0.5"
            style={{ color: accent.text, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {title}
          </div>
          <div className="text-xs text-[var(--sg-text-secondary)] truncate leading-snug">
            {!isOpen && summary}
          </div>
        </div>

        {/* Chevron */}
        <ChevronIcon isOpen={isOpen} color={accent.text} />
      </button>

      {/* Collapsible content */}
      <div
        style={{
          maxHeight: isOpen ? `${contentHeight ?? 2000}px` : '0px',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        }}
      >
        {/* Divider */}
        <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${accent.border}, transparent)` }} />
        <div ref={contentRef} className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ isOpen, color }: { isOpen: boolean; color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        color,
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
      }}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
