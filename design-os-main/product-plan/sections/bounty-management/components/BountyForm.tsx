import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ArrowLeft,
  Save,
  Rocket,
  Lock,
  Info,
  X,
  Plus,
  Check,
  Type,
  Link2,
  ImageIcon,
} from 'lucide-react'
import type { BountyFormProps, Bounty, ProofType, BountyPriority } from '../types'

type SaveStatus = 'idle' | 'saving' | 'saved'

const proofOptions: { type: ProofType; label: string; icon: typeof Type }[] = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'link', label: 'Link', icon: Link2 },
  { type: 'image', label: 'Image', icon: ImageIcon },
]

function LockedField({ children, locked, reason }: { children: React.ReactNode; locked?: boolean; reason?: string }) {
  const [showTooltip, setShowTooltip] = useState(false)
  if (!locked) return <>{children}</>
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-60">{children}</div>
      <div
        className="absolute right-2 top-2 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Lock className="h-4 w-4 text-amber-500" />
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-2 w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {reason || 'This field is locked because submissions already exist.'}
          </div>
        )}
      </div>
    </div>
  )
}

export function BountyForm({
  bounty,
  categories,
  hasSubmissions = false,
  onSave,
  onPublish,
  onCancel,
}: BountyFormProps) {
  const isEdit = !!bounty
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const [form, setForm] = useState({
    title: bounty?.title ?? '',
    description: bounty?.description ?? '',
    instructions: bounty?.instructions ?? '',
    categoryId: bounty?.categoryId ?? '',
    tags: bounty?.tags ?? [],
    rewardAmount: bounty?.rewardAmount ?? 0,
    startDate: bounty?.startDate?.split('T')[0] ?? '',
    endDate: bounty?.endDate?.split('T')[0] ?? '',
    maxSubmissions: bounty?.maxSubmissions ?? 10,
    eligibilityCriteria: bounty?.eligibilityCriteria ?? '',
    proofRequirements: bounty?.proofRequirements ?? [],
    proofTemplate: bounty?.proofTemplate ?? '',
    priority: bounty?.priority ?? ('medium' as BountyPriority),
    featured: bounty?.featured ?? false,
    termsAndConditions: bounty?.termsAndConditions ?? '',
  })

  const [tagInput, setTagInput] = useState('')

  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      onSave?.(form as Partial<Bounty>)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 1000)
  }, [form, onSave])

  useEffect(() => {
    if (form.title) {
      triggerAutoSave()
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [form, triggerAutoSave])

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !form.tags.includes(tag)) {
      updateField('tags', [...form.tags, tag])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    updateField('tags', form.tags.filter((t) => t !== tag))
  }

  function toggleProofType(type: ProofType) {
    if (form.proofRequirements.includes(type)) {
      updateField('proofRequirements', form.proofRequirements.filter((t) => t !== type))
    } else {
      updateField('proofRequirements', [...form.proofRequirements, type])
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-700 dark:focus:ring-pink-900/30'

  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5'

  return (
    <div className="min-h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onCancel?.()}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1
                className="text-xl font-bold text-slate-900 dark:text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {isEdit ? 'Edit Bounty' : 'Create Bounty'}
              </h1>
              {isEdit && hasSubmissions && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Info className="h-3 w-3" />
                  Some fields are locked because submissions exist
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              {saveStatus === 'saving' && (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  Saving...
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  Saved
                </>
              )}
              {saveStatus === 'idle' && (
                <>
                  <Save className="h-3 w-3" />
                  Auto-save
                </>
              )}
            </span>

            {bounty?.status === 'draft' && (
              <button
                onClick={() => onPublish?.(bounty.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                <Rocket className="h-4 w-4" />
                Publish
              </button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Section: Basic Info */}
          <section>
            <h2
              className="mb-4 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Basic Info
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Give your bounty a clear, descriptive title"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Brief summary of what this bounty is about"
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Instructions</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => updateField('instructions', e.target.value)}
                  placeholder="Step-by-step instructions for completing this bounty"
                  rows={6}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => updateField('categoryId', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add a tag"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {form.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section: Requirements */}
          <section>
            <h2
              className="mb-4 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Requirements
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Eligibility Criteria</label>
                <textarea
                  value={form.eligibilityCriteria}
                  onChange={(e) => updateField('eligibilityCriteria', e.target.value)}
                  placeholder="Who is eligible to complete this bounty?"
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Proof Requirements</label>
                <div className="flex flex-wrap gap-2">
                  {proofOptions.map((opt) => {
                    const selected = form.proofRequirements.includes(opt.type)
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => toggleProofType(opt.type)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                          selected
                            ? 'border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-950/40 dark:text-pink-300'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className={labelClass}>Proof Template (optional)</label>
                <textarea
                  value={form.proofTemplate}
                  onChange={(e) => updateField('proofTemplate', e.target.value)}
                  placeholder="Provide a template participants should follow when submitting proof"
                  rows={4}
                  className={`${inputClass}`}
                  style={{ fontFamily: "'Source Code Pro', monospace" }}
                />
              </div>
            </div>
          </section>

          {/* Section: Reward & Dates */}
          <section>
            <h2
              className="mb-4 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Reward & Dates
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <LockedField
                locked={isEdit && hasSubmissions}
                reason="Reward amount cannot be changed after submissions have been received."
              >
                <div>
                  <label className={labelClass}>Reward Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rewardAmount || ''}
                    onChange={(e) => updateField('rewardAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={inputClass}
                    style={{ fontFamily: "'Source Code Pro', monospace" }}
                  />
                </div>
              </LockedField>
              <div>
                <label className={labelClass}>Max Submissions</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxSubmissions || ''}
                  onChange={(e) => updateField('maxSubmissions', parseInt(e.target.value) || 0)}
                  placeholder="10"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Section: Settings */}
          <section>
            <h2
              className="mb-4 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Settings
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as BountyPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateField('priority', p)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-all ${
                        form.priority === p
                          ? 'border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-950/40 dark:text-pink-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateField('featured', !form.featured)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    form.featured ? 'bg-pink-600 dark:bg-pink-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      form.featured ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Featured bounty
                </label>
              </div>
              <div>
                <label className={labelClass}>Terms & Conditions</label>
                <textarea
                  value={form.termsAndConditions}
                  onChange={(e) => updateField('termsAndConditions', e.target.value)}
                  placeholder="Any terms, conditions, or legal requirements"
                  rows={4}
                  className={inputClass}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
