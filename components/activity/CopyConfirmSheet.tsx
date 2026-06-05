"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { QuoteCard } from "@/components/activity/QuoteCard";
import type { ActivityEvent } from "@/hooks/useActivity";

export interface CopyConfirmSheetProps {
  /** The event whose copy execution is being confirmed, or null when closed. */
  event: ActivityEvent | null;
  onClose: () => void;
}

/**
 * Central "Confirm copy" bottom-sheet. Wraps the existing execution flow
 * (QuoteCard) so the Omniston quote — sell→receive, rate, slippage, route +
 * resolver, expiry — is the focus, instead of being buried inside an
 * expandable feed row. Opened from Mirror's "Needs your attention" block and
 * from Activity rows.
 */
export function CopyConfirmSheet({ event, onClose }: CopyConfirmSheetProps) {
  const open = event !== null && event.execution !== null && event.decision !== null;

  return (
    <BottomSheet isOpen={open} onClose={onClose} heightPercent={78}>
      {open && event.execution && event.decision && (
        <div className="px-4 pb-4">
          <QuoteCard
            executionId={event.execution.id}
            soldToken={event.soldToken}
            boughtToken={event.boughtToken}
            plannedAmount={event.decision.plannedAmountDecimal ?? event.usdEstimate ?? 10}
            slippageBps={100}
            onDismiss={onClose}
          />
        </div>
      )}
    </BottomSheet>
  );
}
