import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { useText } from '../../lib/i18n/index.ts';
import { IconButton } from '../icon-button/IconButton.tsx';

export interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// A bottom sheet on phones and a centred dialog from the sm breakpoint. The native modal <dialog>
// keeps focus inside and makes the page behind it inert.
export const Dialog = ({ open, title, onClose, children }: DialogProps) => {
  const text = useText('components.dialog');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!open || dialog === null) {
      return undefined;
    }

    const opener = document.activeElement;
    const root = document.documentElement;
    const overflow = root.style.overflow;

    // A click on the dialog element itself, not its content, is a click on the backdrop. Escape
    // (onCancel) is the keyboard way to close, so this listener is for pointers only.
    const closeOnBackdrop = (event: globalThis.MouseEvent): void => {
      if (event.target === dialog) {
        onCloseRef.current();
      }
    };

    dialog.showModal();
    // showModal focuses the close button, and Safari rings it even after a tap. The dialog takes
    // the focus itself instead; Tab moves into it from there.
    dialog.focus();
    dialog.addEventListener('click', closeOnBackdrop);
    root.style.overflow = 'hidden';

    return () => {
      dialog.removeEventListener('click', closeOnBackdrop);
      dialog.close();
      root.style.overflow = overflow;

      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  }, [open]);

  // The parent owns the open state, so Escape asks it to close instead of closing natively.
  const cancel = (event: SyntheticEvent<HTMLDialogElement>): void => {
    event.preventDefault();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      tabIndex={-1}
      onCancel={cancel}
      className="bg-dex-paper text-dex-ink shadow-panel backdrop:bg-dex-ink/50 rounded-t-panel border-t-dex-red motion-safe:animate-rise sm:rounded-panel inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto overscroll-contain border-t-6 p-0 outline-none sm:inset-0 sm:m-auto sm:max-w-lg"
    >
      <div className="safe-area-sheet flex flex-col gap-4 pt-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-extrabold">
            {title}
          </h2>
          <IconButton icon={<X size={20} />} label={text.close} onClick={onClose} />
        </div>
        {open ? children : null}
      </div>
    </dialog>
  );
};
