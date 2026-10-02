import { useEffect, type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib';
import {
  Check,
  Info,
  AlertTriangle,
  XCircle,
  LogIn,
  HelpCircle,
  AlertOctagon,
} from 'lucide-react';

export type FeedbackTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'auth'
  | 'confirm'
  | 'destructive';

export interface FeedbackAction {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
}

export interface FeedbackPopupProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  tone: FeedbackTone;
  title: string;
  message: React.ReactNode;
  /** Optional small context line below message */
  meta?: string;
  primaryAction: FeedbackAction;
  secondaryAction?: FeedbackAction;
}

/**
 * Tone config — colours are extracted 1:1 from Figma Scenario Gallery fills.
 *
 * Card background is white (light theme).
 * Icon circle = tone colour at 10 % opacity.
 * Icon glyph  = tone colour (full opacity, visible on white).
 * Primary btn bg = tone colour; text = bg-base (near-black).
 * Secondary btn = transparent, text = black.
 */
const TONE_CONFIG: Record<
  FeedbackTone,
  { icon: React.ElementType; iconWrapper: string; primaryBtn: string }
> = {
  // r=0.600 g=0.851 b=0.678 → #99D9AD  (status-success)
  success: {
    icon: Check,
    iconWrapper: 'bg-status-success/10 text-status-success',
    primaryBtn:
      'bg-status-success text-bg-base hover:bg-status-success/80 focus:ring-status-success',
  },
  // r=0.447 g=0.659 b=1.0 → #72A8FF  (brand-blue)
  info: {
    icon: Info,
    iconWrapper: 'bg-brand-blue/10 text-brand-blue',
    primaryBtn:
      'bg-brand-blue text-bg-base hover:bg-[#4a85e0] focus:ring-brand-blue',
  },
  // r=1.0 g=0.918 b=0.671 → #FFEAAB  (status-warning)
  warning: {
    icon: AlertTriangle,
    iconWrapper: 'bg-status-warning/10 text-status-warning',
    primaryBtn:
      'bg-status-warning text-bg-base hover:bg-status-warning/80 focus:ring-status-warning',
  },
  // r=1.0 g=0.647 b=0.647 → #FFA5A5  (status-danger)
  error: {
    icon: XCircle,
    iconWrapper: 'bg-status-danger/10 text-status-danger',
    primaryBtn:
      'bg-status-danger text-bg-base hover:bg-status-danger/80 focus:ring-status-danger',
  },
  // Same accent as info (brand-blue) — Figma icon+btn both use #72A8FF
  auth: {
    icon: LogIn,
    iconWrapper: 'bg-brand-blue/10 text-brand-blue',
    primaryBtn:
      'bg-brand-blue text-bg-base hover:bg-[#4a85e0] focus:ring-brand-blue',
  },
  // Icon circle = warning yellow; primary btn = brand-blue (Figma confirm scenario)
  confirm: {
    icon: HelpCircle,
    iconWrapper: 'bg-status-warning/10 text-status-warning',
    primaryBtn:
      'bg-brand-blue text-bg-base hover:bg-[#4a85e0] focus:ring-brand-blue',
  },
  // Same red as error but confirm-style irreversible action
  destructive: {
    icon: AlertOctagon,
    iconWrapper: 'bg-status-danger/10 text-status-danger',
    primaryBtn:
      'bg-status-danger text-bg-base hover:bg-status-danger/80 focus:ring-status-danger',
  },
};

function LoadingSpinner() {
  return (
    <svg
      className="mr-2 h-4 w-4 animate-spin text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * FeedbackPopup — modal dialog for outcomes requiring acknowledgement.
 *
 * Layout follows Figma "Feedback Popup" component set (page 03 Feedback Popup):
 *   • Light-themed white card on dark scrim
 *   • Horizontal: [icon circle] [title + message + meta]
 *   • Actions right-aligned: [secondary (ghost)] [primary (tinted)]
 *
 * Usage:
 * ```tsx
 * <FeedbackPopup
 *   isOpen={open}
 *   tone="auth"
 *   title="Sign in to collect this card"
 *   message="Log in to save cards and reserve seller listings."
 *   meta="You'll return to this card after login."
 *   primaryAction={{ label: 'Log in', onClick: handleLogin }}
 *   secondaryAction={{ label: 'Not now', onClick: onClose }}
 * />
 * ```
 */
export function FeedbackPopup({
  isOpen,
  tone,
  title,
  message,
  meta,
  primaryAction,
  secondaryAction,
  className,
  ...props
}: FeedbackPopupProps) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const config = TONE_CONFIG[tone];
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="fp-title"
      aria-describedby="fp-desc"
    >
      {/*
        Card — white (#FFFFFF), max-w 460px, padding 24px, gap 20px, radius 16px
        (Figma: paddingLeft/Right/Top/Bottom=24, cornerRadius=16, itemSpacing=20)
      */}
      <div
        className={cn(
          'flex w-full max-w-[460px] flex-col gap-5 rounded-2xl bg-white p-6 shadow-xl',
          className,
        )}
        {...props}
      >
        {/* Content — horizontal: icon | copy */}
        {/* Figma: content frame layoutMode=HORIZONTAL, itemSpacing=16 */}
        <div className="flex flex-row gap-4">
          {/* Icon circle — 44×44px, tone colour at 10 % opacity bg */}
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
              config.iconWrapper,
            )}
            aria-hidden="true"
          >
            <Icon size={22} strokeWidth={2} />
          </div>

          {/* Copy — vertical, gap 8px, left-aligned */}
          {/* Figma: copy frame layoutMode=VERTICAL, itemSpacing=8 */}
          <div className="flex flex-col gap-2 text-left">
            {/* Title — black (#000000) */}
            <h2 id="fp-title" className="text-base font-semibold leading-tight text-black">
              {title}
            </h2>
            {/* Message — dark navy (#1B2336 ≈ bg-card) */}
            <p id="fp-desc" className="text-sm leading-relaxed text-bg-card">
              {message}
            </p>
            {/* Meta — darker navy (#18202B ≈ bg-input) */}
            {meta && <p className="text-xs text-bg-input">{meta}</p>}
          </div>
        </div>

        {/* Actions — horizontal, right-aligned */}
        {/* Figma: actions frame layoutMode=HORIZONTAL, primaryAxisAlignItems=MAX, itemSpacing=12 */}
        <div className="flex flex-row justify-end gap-3">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.isLoading}
              className="flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {secondaryAction.isLoading && <LoadingSpinner />}
              {secondaryAction.label}
            </button>
          )}

          <button
            onClick={primaryAction.onClick}
            disabled={primaryAction.isLoading}
            className={cn(
              'flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50',
              config.primaryBtn,
            )}
          >
            {primaryAction.isLoading && <LoadingSpinner />}
            {primaryAction.label}
          </button>
        </div>
      </div>
    </div>
  );
}
