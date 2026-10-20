import { useEffect, useRef, type ReactNode } from 'react';
import { Button, Dialog } from 'tdesign-react';
import { CloseIcon } from 'tdesign-icons-react';
import { detailReturnFocus } from './DetailDrawer';

export function linkPreviewLabels(scope: HTMLElement | null) {
  scope?.querySelectorAll<HTMLLabelElement>('label').forEach(label => {
    const input = label.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not([type="checkbox"]):not([type="radio"]), textarea');
    // Stable identities survive inserted rows; TDesign's delayed portal needs this again on open.
    if (input) { input.id ||= label.htmlFor || input.name || `preview-field-${crypto.randomUUID()}`; label.htmlFor = input.id; }
  });
}

// TDesign 1.x needs explicit modal containment for keyboard users in this React 19 fixture.
export function PreviewDialog({ title, children, footer, onClose, width = 860, initialFocus, returnFocus, className = '' }: {
  title: string; children: ReactNode; footer: ReactNode; onClose: () => void; width?: number; initialFocus?: string; returnFocus?: () => HTMLElement | null; className?: string;
}) {
  const opener = useRef(document.activeElement as HTMLElement | null);
  const stableOpener = useRef(opener.current?.closest('.detail-drawer') ? detailReturnFocus() : null);
  useEffect(() => {
    const background = document.getElementById('root');
    if (background) background.inert = true;
    const focusable = (scope: Element) => [...scope.querySelectorAll<HTMLElement>('button, input, textarea, select, a[href], [tabindex]')]
      .filter(el => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector('.processing-dialog');
      if (!dialog) return;
      const elements = [...focusable(dialog), ...[...document.querySelectorAll('.t-popup')].flatMap(focusable)];
      const first = elements[0], last = elements.at(-1);
      if (first && (!elements.includes(document.activeElement as HTMLElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
        event.preventDefault(); (event.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => { if (background && !document.querySelector('.detail-drawer[aria-hidden="false"]')) background.inert = false; document.removeEventListener('keydown', trap); requestAnimationFrame(() => requestAnimationFrame(() => (returnFocus?.() ?? (opener.current?.isConnected ? opener.current : stableOpener.current))?.focus())); };
  }, []);
  return <Dialog visible header={title} dialogClassName={`request-dialog processing-dialog ${className}`} width={width} placement="center" closeOnOverlayClick={false}
    closeBtn={<Button variant="text" shape="square" icon={<CloseIcon />} aria-label={`关闭${title}`} />} onClose={onClose}
    onOpened={() => { const el = document.querySelector<HTMLElement>('.processing-dialog'); el?.setAttribute('role', 'dialog'); el?.setAttribute('aria-modal', 'true'); el?.setAttribute('aria-label', title); linkPreviewLabels(el); ((initialFocus && el?.querySelector<HTMLElement>(initialFocus)) || el?.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled), button:not(:disabled)'))?.focus(); }} footer={footer}>{children}</Dialog>;
}

