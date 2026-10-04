import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface Props { isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, loading }: Props) => (
  <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="max-w-md">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-5 h-5 text-red-600" />
      </div>
      <p className="text-sm text-slate-600 pt-2">{message}</p>
    </div>
    <div className="flex justify-end gap-3 mt-6">
      <button onClick={onCancel} className="btn-secondary" disabled={loading}>Cancel</button>
      <button onClick={onConfirm} className="btn-danger" disabled={loading}>{loading ? 'Deleting...' : 'Confirm'}</button>
    </div>
  </Modal>
);
