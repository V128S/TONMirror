"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTheme } from "@/components/theme/ThemeProvider";
import { GlassQuoteCard } from "@/components/activity/GlassQuoteCard";
import { TerminalQuoteCard } from "@/components/activity/TerminalQuoteCard";
import type { ActivityEvent } from "@/hooks/useActivity";

export interface CopyConfirmSheetProps {
  /** The event whose copy execution is being confirmed, or null when closed. */
  event: ActivityEvent | null;
  onClose: () => void;
}

/**
 * Central "Confirm copy" bottom-sheet. Surfaces the Omniston quote
 * (sell→receive, rate, slippage, route + resolver, expiry) and drives the
 * quote→prepare→sign→submit flow, themed to match the active design (glass or
 * terminal) so it never looks foreign inside the feed it opens from.
 */
export function CopyConfirmSheet({ event, onClose }: CopyConfirmSheetProps) {
  const { theme } = useTheme();
  const open = event !== null && event.execution !== null && event.decision !== null;

  return (
    <BottomSheet isOpen={open} onClose={onClose} heightPercent={78}>
      {open && event.execution && event.decision && (
        <div className="px-4 pb-4">
          {theme === "terminal" ? (
            <TerminalQuoteCard
              executionId={event.execution.id}
              soldToken={event.soldToken}
              boughtToken={event.boughtToken}
              plannedAmount={event.decision.plannedAmountDecimal ?? event.usdEstimate ?? 10}
              slippageBps={100}
              onDismiss={onClose}
            />
          ) : (
            <GlassQuoteCard
              executionId={event.execution.id}
              soldToken={event.soldToken}
              boughtToken={event.boughtToken}
              plannedAmount={event.decision.plannedAmountDecimal ?? event.usdEstimate ?? 10}
              slippageBps={100}
              onDismiss={onClose}
            />
          )}
        </div>
      )}
    </BottomSheet>
  );
}
