import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg flex-shrink-0 ${
          isDestructive ? 'bg-[#261212] text-[#E57373] border border-[#482020]' : 'bg-[#181611] text-[#E0C15A] border border-[#3A331E]'
        }`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-[#D0D0D0] leading-relaxed">
            {message}
          </p>
          <p className="text-xs text-[#808080] mt-2">
            Esta acción quedará registrada en el libro de auditoría del sistema.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#1C1C1C]">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-[#A0A0A0] bg-[#141414] hover:bg-[#1E1E1E] hover:text-[#FFFFFF] rounded-lg border border-[#262626] transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            isDestructive
              ? 'bg-[#4A1515] text-[#FF9E9E] hover:bg-[#631B1B] border border-[#6B2424]'
              : 'bg-[#C9A227] text-[#0A0A0A] hover:bg-[#E0C15A]'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
