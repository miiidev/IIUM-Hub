import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  busy?: boolean;
}

let lockCount = 0;
let savedOverflow: string | null = null;

function lockScroll() {
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && savedOverflow !== null) {
    document.body.style.overflow = savedOverflow;
    savedOverflow = null;
  }
}

export default function BottomSheet({ open, onClose, title, children, footer, busy = false }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleIdRef = useRef(`sheet-${Math.random().toString(36).slice(2, 10)}`);
  const prevFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement;
    lockScroll();
    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const t = window.setTimeout(() => {
      (target ?? panel)?.focus({ preventScroll: true });
    }, 30);

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      const prev = prevFocusRef.current as HTMLElement | null;
      if (prev && typeof prev.focus === 'function') prev.focus({ preventScroll: true });
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleIdRef.current}>
      <button
        type="button"
        aria-label="Close"
        onClick={() => {
          if (!busy) onClose();
        }}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="pointer-events-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl bg-white outline-none sm:max-w-lg sm:rounded-2xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4">
            <h2 id={titleIdRef.current} className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-xl font-bold text-slate-700 disabled:opacity-40"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          {footer && (
            <div className="safe-bottom border-t border-slate-200 bg-white p-4">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
