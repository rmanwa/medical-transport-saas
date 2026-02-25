import { useEffect, forwardRef } from 'react';
import { cn } from './cn';
import { Button } from './Button';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      children,
      footer,
    },
    ref
  ) => {
    useEffect(() => {
      if (!closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose, closeOnEscape]);

    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [open]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 backdrop-blur-sm',
            'animate-in fade-in duration-200'
          )}
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          className={cn(
            'relative w-full rounded-2xl bg-white shadow-2xl',
            'animate-in zoom-in-95 fade-in duration-200',
            'max-h-[90vh] flex flex-col',
            sizeClasses[size]
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <h2 id="modal-title" className="flex-1 text-lg font-bold text-slate-900">
                {title}
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  'rounded-lg p-1.5 text-slate-400 transition-colors',
                  'hover:bg-slate-100 hover:text-slate-600',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                )}
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-custom">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

// Convenience component for standard modal actions
export const ModalActions = ({
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  loading = false,
  variant = 'primary',
}: {
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: 'primary' | 'danger';
}) => {
  return (
    <>
      {onCancel && (
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
      )}
      {onConfirm && (
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      )}
    </>
  );
};