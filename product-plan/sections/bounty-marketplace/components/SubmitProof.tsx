import { useState } from 'react'
import {
  ArrowLeft,
  Link2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react'
import type { SubmitProofPageProps } from '../types'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function SubmitProof({
  bounty,
  organization,
  onSubmit,
  onBack,
}: SubmitProofPageProps) {
  const [links, setLinks] = useState<string[]>([''])
  const [imageNames, setImageNames] = useState<string[]>([])
  const [showConfirm, setShowConfirm] = useState(false)

  const hasValidLink = links.some((l) => l.trim().length > 0)
  const canSubmit = hasValidLink

  function addLink() {
    setLinks([...links, ''])
  }

  function removeLink(index: number) {
    if (links.length <= 1) return
    setLinks(links.filter((_, i) => i !== index))
  }

  function updateLink(index: number, value: string) {
    const updated = [...links]
    updated[index] = value
    setLinks(updated)
  }

  function handleImageSelect() {
    // Simulated — in real app would use file input
    setImageNames([...imageNames, `proof-image-${imageNames.length + 1}.png`])
  }

  function removeImage(index: number) {
    setImageNames(imageNames.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!canSubmit) return
    const validLinks = links.filter((l) => l.trim().length > 0)
    onSubmit?.(validLinks, [])
  }

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Confirmation overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 dark:bg-pink-950/40">
              <Send className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3
              className="text-lg font-bold text-slate-900 dark:text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Submit your proof?
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You're submitting proof for <strong className="text-slate-700 dark:text-slate-300">{bounty.title}</strong>.
              You can only submit once per bounty.
            </p>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong>{links.filter((l) => l.trim()).length}</strong> link{links.filter((l) => l.trim()).length !== 1 ? 's' : ''}
                {imageNames.length > 0 && (
                  <>, <strong>{imageNames.length}</strong> image{imageNames.length !== 1 ? 's' : ''}</>
                )}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  handleSubmit()
                }}
                className="flex-1 rounded-xl bg-pink-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => onBack?.()}
          className="mb-6 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bounty
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Submit Proof
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {organization.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{bounty.title}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {organization.name} &middot; Reward: <span
                  className="font-semibold text-pink-600 dark:text-pink-400"
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                >{formatCurrency(bounty.rewardAmount)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Required proof types */}
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
          <AlertTriangle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            This bounty requires: {bounty.proofRequirements.map((r) => r === 'link' ? 'Links' : r === 'image' ? 'Images' : 'Text').join(', ')}
          </p>
        </div>

        {/* Links section */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Proof Links</h2>
                <span className="rounded bg-pink-50 px-1.5 py-0.5 text-[10px] font-semibold text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">Required</span>
              </div>
              <button
                onClick={addLink}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Plus className="h-3 w-3" />
                Add link
              </button>
            </div>
          </div>
          <div className="space-y-3 p-6">
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => updateLink(i, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:bg-slate-900 dark:focus:ring-pink-900/30"
                  />
                </div>
                {links.length > 1 && (
                  <button
                    onClick={() => removeLink(i)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Images section */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Proof Images</h2>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">Optional</span>
            </div>
          </div>
          <div className="p-6">
            {/* Uploaded images */}
            {imageNames.length > 0 && (
              <div className="mb-4 space-y-2">
                {imageNames.map((name, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{name}</span>
                    </div>
                    <button
                      onClick={() => removeImage(i)}
                      className="rounded p-1 text-slate-400 transition-colors hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload area */}
            <button
              onClick={handleImageSelect}
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 transition-colors hover:border-pink-300 hover:bg-pink-50/30 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-pink-700 dark:hover:bg-pink-950/10"
            >
              <Upload className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                Click to upload images
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                PNG, JPG, GIF up to 10MB each
              </p>
            </button>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Ready to submit?</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">You can only submit once per bounty.</p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-pink-500 dark:hover:bg-pink-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            Review & Submit
          </button>
        </div>
      </div>
    </div>
  )
}
