import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmationDialogProps {
  title: string
  description: string
  confirmLabel: string
  confirmColor: 'red' | 'emerald' | 'pink' | 'amber'
  requireReason: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

const colorMap = {
  red: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600',
  pink: 'bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600',
  amber: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600',
}

const iconColorMap = {
  red: 'text-red-600 dark:text-red-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  pink: 'text-pink-600 dark:text-pink-400',
  amber: 'text-amber-600 dark:text-amber-400',
}

export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  confirmColor,
  requireReason,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [reason, setReason] = useState('')

  const canConfirm = !requireReason || reason.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`mt-0.5 shrink-0 ${iconColorMap[confirmColor]}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-base font-bold text-slate-900 dark:text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>

            {requireReason && (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a reason for this action..."
                  rows={3}
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:ring-pink-900/30"
                />
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(reason)}
                disabled={!canConfirm}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-40 ${colorMap[confirmColor]}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
