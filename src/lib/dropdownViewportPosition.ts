/**
 * Position fixed pour listes en portail : reste dans le viewport
 * (évite coupure en bas d’écran / drawer). Le panneau est en flex colonne
 * avec maxHeight ; la liste doit être flex-1 min-h-0 overflow-y-auto.
 */
export type ViewportAnchoredDropdown =
  | {
      placement: "below";
      top: number;
      left: number;
      width: number;
      maxHeight: number;
    }
  | {
      placement: "above";
      bottom: number;
      left: number;
      width: number;
      maxHeight: number;
    };

const MARGIN = 10;

export function computeViewportAnchoredDropdown(
  trigger: DOMRect,
  opts?: { minPanelHeight?: number }
): ViewportAnchoredDropdown {
  const minPanel = opts?.minPanelHeight ?? 160;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const width = Math.min(trigger.width, vw - MARGIN * 2);
  let left = trigger.left;
  if (left + width > vw - MARGIN) left = vw - MARGIN - width;
  if (left < MARGIN) left = MARGIN;

  const availableBelow = vh - trigger.bottom - MARGIN * 2;
  const availableAbove = trigger.top - MARGIN * 2;

  const preferBelow = availableBelow >= availableAbove;

  if (preferBelow) {
    const top = trigger.bottom + MARGIN;
    const maxHeight = Math.min(availableBelow, Math.max(80, minPanel));
    return { placement: "below", top, left, width, maxHeight };
  }

  const bottom = vh - trigger.top + MARGIN;
  const maxHeight = Math.min(availableAbove, Math.max(80, minPanel));
  return { placement: "above", bottom, left, width, maxHeight };
}
