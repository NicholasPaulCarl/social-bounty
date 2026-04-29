'use client';

import { useReducer, useCallback, useMemo } from 'react';
import {
  PostVisibilityRule,
  RewardType,
  ContentFormat,
  SocialChannel,
  PostFormat,
  BountyAccessType,
} from '@social-bounty/shared';
import type {
  CreateBountyRequest,
  BountyDetailResponse,
} from '@social-bounty/shared';
import type { BountyFormState, BountyFormAction } from './types';
import { INITIAL_FORM_STATE } from './types';
import { validateFull, validateDraft, validateField } from './validation';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function formReducer(state: BountyFormState, action: BountyFormAction): BountyFormState {
  switch (action.type) {
    // Section 1
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_SHORT_DESCRIPTION':
      return { ...state, shortDescription: action.payload };
    case 'SET_CONTENT_FORMAT':
      return { ...state, contentFormat: action.payload };
    case 'SET_FULL_INSTRUCTIONS':
      return { ...state, fullInstructions: action.payload };
    case 'ADD_INSTRUCTION_STEP':
      return { ...state, instructionSteps: [...state.instructionSteps, ''] };
    case 'REMOVE_INSTRUCTION_STEP':
      return { ...state, instructionSteps: state.instructionSteps.filter((_, i) => i !== action.payload) };
    case 'UPDATE_INSTRUCTION_STEP':
      return {
        ...state,
        instructionSteps: state.instructionSteps.map((s, i) =>
          i === action.payload.index ? action.payload.value : s,
        ),
      };

    // Section 1 cont: Channels
    case 'TOGGLE_CHANNEL': {
      const ch = action.payload.channel as SocialChannel;
      const current = { ...state.channels };
      let contentFormat = state.contentFormat;
      if (current[ch]) {
        delete current[ch];
      } else {
        current[ch] = action.payload.formats as PostFormat[];
        // TikTok is a video-only platform — Photo Only is invalid once
        // TikTok is in play. Auto-set Accepted Formats to VIDEO_ONLY so
        // the brand doesn't have to do it manually; they can still
        // switch to BOTH (video + photo) afterwards if they want photos
        // from non-TikTok channels alongside.
        if (ch === SocialChannel.TIKTOK) {
          contentFormat = ContentFormat.VIDEO_ONLY;
        }
      }
      return { ...state, channels: current, contentFormat };
    }
    case 'TOGGLE_FORMAT': {
      const ch = action.payload.channel as SocialChannel;
      const fmt = action.payload.format as PostFormat;
      const current = { ...state.channels };
      const formats = [...(current[ch] || [])];
      const idx = formats.indexOf(fmt);
      if (idx >= 0) {
        formats.splice(idx, 1);
      } else {
        formats.push(fmt);
      }
      // Brief: "If all formats unchecked, platform deactivates."
      // Mirror TOGGLE_CHANNEL's `delete current[ch]` pattern — an empty
      // formats array means the channel is effectively off.
      if (formats.length === 0) {
        delete current[ch];
      } else {
        current[ch] = formats;
      }
      return { ...state, channels: current };
    }

    // Section 3
    case 'SET_AI_CONTENT_PERMITTED':
      return { ...state, aiContentPermitted: action.payload };
    case 'SET_TAG_ACCOUNT':
      return {
        ...state,
        engagementRequirements: { ...state.engagementRequirements, tagAccount: action.payload || null },
      };
    case 'SET_MENTION':
      return {
        ...state,
        engagementRequirements: { ...state.engagementRequirements, mention: action.payload },
      };
    case 'SET_COMMENT':
      return {
        ...state,
        engagementRequirements: { ...state.engagementRequirements, comment: action.payload },
      };

    // Section 4
    case 'SET_VISIBILITY_RULE': {
      if (action.payload === null) {
        return {
          ...state,
          postVisibility: null,
        };
      }
      return {
        ...state,
        postVisibility: {
          rule: action.payload,
          minDurationValue: action.payload === PostVisibilityRule.MINIMUM_DURATION ? state.postVisibility?.minDurationValue ?? null : null,
          minDurationUnit: action.payload === PostVisibilityRule.MINIMUM_DURATION ? state.postVisibility?.minDurationUnit ?? null : null,
        },
      };
    }
    case 'SET_DURATION_VALUE':
      return {
        ...state,
        postVisibility: state.postVisibility
          ? { ...state.postVisibility, minDurationValue: action.payload }
          : null,
      };
    case 'SET_DURATION_UNIT':
      return {
        ...state,
        postVisibility: state.postVisibility
          ? { ...state.postVisibility, minDurationUnit: action.payload }
          : null,
      };

    // Section 5
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload };
    case 'SET_PAYOUT_METHOD':
      return { ...state, payoutMethod: action.payload };
    case 'ADD_REWARD':
      return {
        ...state,
        // New reward defaults to CASH, so seed name='Cash' to match the
        // UPDATE_REWARD auto-fill convention (see below).
        rewards: [...state.rewards, { rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 0 }],
      };
    case 'REMOVE_REWARD': {
      const rewards = state.rewards.filter((_, i) => i !== action.payload);
      return { ...state, rewards };
    }
    case 'UPDATE_REWARD': {
      const rewards = state.rewards.map((r, i) => {
        if (i !== action.payload.index) return r;
        const next = { ...r, [action.payload.field]: action.payload.value };
        // CASH rewards don't need a description — the value + currency is
        // self-describing. Auto-set name to 'Cash' when switching TO cash,
        // and clear it when switching FROM cash so the user re-enters a
        // meaningful name for Product/Service/Other.
        if (action.payload.field === 'rewardType') {
          if (action.payload.value === RewardType.CASH) {
            next.name = 'Cash';
          } else if (r.rewardType === RewardType.CASH) {
            next.name = '';
          }
        }
        return next;
      });
      return { ...state, rewards };
    }

    // Section 6
    case 'SET_MIN_FOLLOWERS':
      return {
        ...state,
        structuredEligibility: { ...state.structuredEligibility, minFollowers: action.payload },
      };
    case 'SET_PUBLIC_PROFILE':
      return {
        ...state,
        structuredEligibility: { ...state.structuredEligibility, publicProfile: action.payload },
      };
    case 'SET_MIN_ACCOUNT_AGE':
      return {
        ...state,
        structuredEligibility: { ...state.structuredEligibility, minAccountAgeDays: action.payload },
      };
    case 'SET_LOCATION_RESTRICTION':
      return {
        ...state,
        structuredEligibility: { ...state.structuredEligibility, locationRestriction: action.payload },
      };
    case 'SET_NO_COMPETING_BRAND_DAYS':
      return {
        ...state,
        structuredEligibility: { ...state.structuredEligibility, noCompetingBrandDays: action.payload },
      };
    case 'ADD_CUSTOM_RULE':
      return {
        ...state,
        structuredEligibility: {
          ...state.structuredEligibility,
          customRules: [...(state.structuredEligibility.customRules || []), ''],
        },
      };
    case 'REMOVE_CUSTOM_RULE':
      return {
        ...state,
        structuredEligibility: {
          ...state.structuredEligibility,
          customRules: (state.structuredEligibility.customRules || []).filter((_, i) => i !== action.payload),
        },
      };
    case 'UPDATE_CUSTOM_RULE':
      return {
        ...state,
        structuredEligibility: {
          ...state.structuredEligibility,
          customRules: (state.structuredEligibility.customRules || []).map((r, i) =>
            i === action.payload.index ? action.payload.value : r,
          ),
        },
      };

    // Section 3: Proof Requirements (checkbox toggle)
    case 'TOGGLE_PROOF_REQUIREMENT': {
      const val = action.payload;
      const current = state.proofRequirements;
      const newReqs = current.includes(val)
        ? current.filter((r) => r !== val)
        : [...current, val];
      return { ...state, proofRequirements: newReqs };
    }

    // Section 8
    case 'SET_MAX_SUBMISSIONS':
      return { ...state, maxSubmissions: action.payload };

    // Section 9
    case 'SET_START_DATE':
      return { ...state, startDate: action.payload };
    case 'SET_END_DATE':
      return { ...state, endDate: action.payload };

    // Section 10
    case 'SET_MIN_VIEWS':
      return { ...state, payoutMetrics: { ...state.payoutMetrics, minViews: action.payload } };
    case 'SET_MIN_LIKES':
      return { ...state, payoutMetrics: { ...state.payoutMetrics, minLikes: action.payload } };
    case 'SET_MIN_COMMENTS':
      return { ...state, payoutMetrics: { ...state.payoutMetrics, minComments: action.payload } };

    // Section 4: Brand Assets staging
    case 'STAGE_BRAND_ASSET_FILES':
      return { ...state, stagedBrandAssetFiles: [...state.stagedBrandAssetFiles, ...action.payload] };
    case 'REMOVE_STAGED_BRAND_ASSET':
      return { ...state, stagedBrandAssetFiles: state.stagedBrandAssetFiles.filter((_, i) => i !== action.payload) };

    // Section 5: Access Type
    case 'SET_ACCESS_TYPE':
      return {
        ...state,
        accessType: action.payload,
        // Clear invitations when switching back to public
        invitations: action.payload === BountyAccessType.PUBLIC ? [] : state.invitations,
        selectedHunters: action.payload === BountyAccessType.PUBLIC ? [] : state.selectedHunters,
      };
    case 'ADD_INVITATION':
      return { ...state, invitations: [...state.invitations, action.payload] };
    case 'REMOVE_INVITATION':
      return { ...state, invitations: state.invitations.filter((_, i) => i !== action.payload) };
    case 'ADD_SELECTED_HUNTER':
      if (state.selectedHunters.some((h) => h.id === action.payload.id)) return state;
      return { ...state, selectedHunters: [...state.selectedHunters, action.payload] };
    case 'REMOVE_SELECTED_HUNTER':
      return { ...state, selectedHunters: state.selectedHunters.filter((h) => h.id !== action.payload) };

    // Validation
    case 'SET_TOUCHED':
      return { ...state, touched: { ...state.touched, [action.payload]: true } };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'SET_SUBMIT_ATTEMPTED':
      return { ...state, submitAttempted: true };

    // Bulk load from existing bounty
    case 'LOAD_BOUNTY': {
      const b = action.payload;
      return {
        ...state,
        title: b.title,
        shortDescription: b.shortDescription,
        contentFormat: b.contentFormat ?? ContentFormat.BOTH,
        fullInstructions: b.fullInstructions,
        instructionSteps: b.instructionSteps?.length ? b.instructionSteps : [''],
        channels: b.channels || {},
        aiContentPermitted: b.aiContentPermitted,
        engagementRequirements: b.engagementRequirements || { tagAccount: null, mention: false, comment: false },
        postVisibility: b.postVisibility || null,
        currency: b.currency,
        rewards: b.rewards.length > 0
          ? b.rewards.map((r) => ({
              rewardType: r.rewardType,
              name: r.name,
              monetaryValue: parseFloat(r.monetaryValue),
            }))
          : [{ rewardType: RewardType.CASH, name: 'Cash', monetaryValue: 0 }],
        payoutMethod: b.payoutMethod ?? null,
        structuredEligibility: b.structuredEligibility || {
          minFollowers: null,
          publicProfile: false,
          minAccountAgeDays: null,
          locationRestriction: null,
          noCompetingBrandDays: null,
          customRules: [],
        },
        proofRequirements: b.proofRequirements ? b.proofRequirements.split(',').filter(Boolean) : [],
        maxSubmissions: b.maxSubmissions,
        startDate: b.startDate ? new Date(b.startDate) : null,
        endDate: b.endDate ? new Date(b.endDate) : null,
        payoutMetrics: b.payoutMetrics || { minViews: null, minLikes: null, minComments: null },
        stagedBrandAssetFiles: [],
        accessType: b.accessType,
        invitations: [],
        selectedHunters: [],
        errors: {},
        touched: {},
        submitAttempted: false,
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Pure conversion function (exported for testing)
// ---------------------------------------------------------------------------

export function buildCreateBountyRequest(
  state: BountyFormState,
  mode: 'draft' | 'full' = 'full',
): CreateBountyRequest {
  // CASH rewards are kept even if the user cleared the auto-filled name
  // (defensive — the reducer keeps name='Cash' for CASH, but if the
  // backend ever persists an empty CASH name we still want it to submit).
  const filteredRewards = state.rewards.filter(
    (r) => (r.rewardType === RewardType.CASH || r.name.trim()) && r.monetaryValue > 0,
  );

  const hasEligibility = state.structuredEligibility.minFollowers !== null ||
    state.structuredEligibility.publicProfile ||
    state.structuredEligibility.minAccountAgeDays !== null ||
    state.structuredEligibility.locationRestriction !== null ||
    state.structuredEligibility.noCompetingBrandDays !== null ||
    (state.structuredEligibility.customRules && state.structuredEligibility.customRules.length > 0);

  const hasEngagement = state.engagementRequirements.tagAccount !== null ||
    state.engagementRequirements.mention ||
    state.engagementRequirements.comment;

  const hasPayoutMetrics = state.payoutMetrics.minViews !== null ||
    state.payoutMetrics.minLikes !== null ||
    state.payoutMetrics.minComments !== null;

  if (mode === 'draft') {
    // Draft mode: only include fields with meaningful data
    const request: any = {
      title: state.title.trim(),
    };
    if (state.shortDescription.trim()) request.shortDescription = state.shortDescription.trim();
    request.contentFormat = state.contentFormat;
    const filteredSteps = state.instructionSteps.filter((s) => s.trim());
    if (filteredSteps.length > 0) {
      request.instructionSteps = filteredSteps;
      request.fullInstructions = filteredSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    } else if (state.fullInstructions.trim()) {
      request.fullInstructions = state.fullInstructions.trim();
    }
    if (state.proofRequirements.length > 0) {
      request.proofRequirements = state.proofRequirements.join(',');
    }
    if (state.maxSubmissions !== null) request.maxSubmissions = state.maxSubmissions;
    if (state.startDate) request.startDate = state.startDate.toISOString();
    if (state.endDate) request.endDate = state.endDate.toISOString();
    if (Object.keys(state.channels).length > 0) request.channels = state.channels;
    if (filteredRewards.length > 0) request.rewards = filteredRewards;
    if (state.postVisibility !== null) request.postVisibility = state.postVisibility;
    if (hasEligibility) request.structuredEligibility = state.structuredEligibility;
    request.currency = state.currency;
    request.aiContentPermitted = state.aiContentPermitted;
    if (hasEngagement) request.engagementRequirements = state.engagementRequirements;
    if (hasPayoutMetrics) request.payoutMetrics = state.payoutMetrics;
    if (state.payoutMethod !== null) request.payoutMethod = state.payoutMethod;
    request.accessType = state.accessType;
    if (state.accessType === BountyAccessType.CLOSED && state.invitations.length > 0) {
      request.invitations = state.invitations;
    }
    return request as CreateBountyRequest;
  }

  // Full mode: include everything
  const filteredSteps = state.instructionSteps.filter((s) => s.trim());
  return {
    title: state.title.trim(),
    shortDescription: state.shortDescription.trim(),
    contentFormat: state.contentFormat,
    fullInstructions: filteredSteps.length > 0
      ? filteredSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : state.fullInstructions.trim(),
    ...(filteredSteps.length > 0 ? { instructionSteps: filteredSteps } : {}),
    proofRequirements: state.proofRequirements.join(','),
    maxSubmissions: state.maxSubmissions,
    startDate: state.startDate?.toISOString() ?? null,
    endDate: state.endDate?.toISOString() ?? null,
    channels: state.channels,
    rewards: filteredRewards.length > 0 ? filteredRewards : state.rewards,
    postVisibility: state.postVisibility || { rule: PostVisibilityRule.MUST_NOT_REMOVE },
    structuredEligibility: state.structuredEligibility,
    currency: state.currency,
    aiContentPermitted: state.aiContentPermitted,
    engagementRequirements: state.engagementRequirements,
    payoutMetrics: hasPayoutMetrics ? state.payoutMetrics : undefined,
    ...(state.payoutMethod !== null ? { payoutMethod: state.payoutMethod } : {}),
    accessType: state.accessType,
    ...(state.accessType === BountyAccessType.CLOSED && state.invitations.length > 0
      ? { invitations: state.invitations }
      : {}),
  } as CreateBountyRequest;
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing — see __tests__/useCreateBountyForm.test.ts)
// ---------------------------------------------------------------------------

/**
 * Per ADR 0013 §1, the brand sees TWO numbers:
 *   • per-claim = sum(rewards) — what one approved hunter earns;
 *   • total     = per-claim × maxSubmissions — what's escrowed on TradeSafe.
 *
 * Falls back to ×1 when `maxSubmissions` is null so the UI renders without
 * NaN before the brand fills the field. The funding service guards on
 * `maxSubmissions != null` separately at the API boundary (ADR 0013 §2).
 */
export function computePerClaimRewardValue(
  rewards: { monetaryValue: number }[],
): number {
  return rewards.reduce((sum, r) => sum + (r.monetaryValue || 0), 0);
}

export function computeTotalRewardValue(
  rewards: { monetaryValue: number }[],
  maxSubmissions: number | null,
): number {
  return computePerClaimRewardValue(rewards) * (maxSubmissions ?? 1);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Pure reducer initializer (exported for unit testability). The hook
 * runs this exactly once at mount via React's `useReducer(reducer,
 * initialArg, init)` contract. Edit mode (`initialBounty`) trumps the
 * preset (`initialFormOverride`) when both are provided — preset is
 * ignored to keep stale `?preset=...` query params from clobbering an
 * existing draft when the brand reloads the edit page.
 */
export function initBountyFormState(
  base: BountyFormState,
  initialBounty?: BountyDetailResponse,
  initialFormOverride?: Partial<BountyFormState>,
): BountyFormState {
  if (initialBounty) {
    return formReducer(base, { type: 'LOAD_BOUNTY', payload: initialBounty });
  }
  if (initialFormOverride) {
    return { ...base, ...initialFormOverride };
  }
  return base;
}

export function useCreateBountyForm(
  initialBounty?: BountyDetailResponse,
  initialFormOverride?: Partial<BountyFormState>,
) {
  // The init arg is a closure over the props captured at mount; React
  // runs it exactly once for the lifetime of the component, so the
  // preset can never re-apply on top of in-progress user edits.
  const [state, dispatch] = useReducer(formReducer, INITIAL_FORM_STATE, (init) =>
    initBountyFormState(init, initialBounty, initialFormOverride),
  );

  // Per ADR 0013 §1, the brand sees TWO numbers in the form:
  //   • perClaimRewardValue = sum(rewards) — what one approved hunter earns.
  //   • totalRewardValue    = perClaimRewardValue × maxSubmissions
  //                         — what the brand actually escrows on TradeSafe.
  // Both are exported so RewardLinesSection can render the breakdown
  // ("R100 per claim × 5 claims = R500 total") and the wizard footer
  // surfaces the multiplied total prominently. When `maxSubmissions` is
  // null (brand hasn't filled the field yet) we fall back to ×1 so the
  // UI doesn't render NaN — the create-bounty backend gates funding on
  // `maxSubmissions != null` separately.
  const perClaimRewardValue = useMemo(
    () => computePerClaimRewardValue(state.rewards),
    [state.rewards],
  );
  const totalRewardValue = useMemo(
    () => computeTotalRewardValue(state.rewards, state.maxSubmissions),
    [state.rewards, state.maxSubmissions],
  );

  const validate = useCallback(
    (mode: 'full' | 'draft' = 'full') => {
      const errors = mode === 'draft' ? validateDraft(state) : validateFull(state);
      dispatch({ type: 'SET_ERRORS', payload: errors });
      if (mode === 'full') {
        dispatch({ type: 'SET_SUBMIT_ATTEMPTED' });
      }
      return Object.keys(errors).length === 0;
    },
    [state],
  );

  const handleBlur = useCallback(
    (field: string) => {
      dispatch({ type: 'SET_TOUCHED', payload: field });
      const error = validateField(field, state);
      if (error) {
        dispatch({ type: 'SET_ERRORS', payload: { ...state.errors, [field]: error } });
      } else {
        const { [field]: _, ...rest } = state.errors;
        dispatch({ type: 'SET_ERRORS', payload: rest });
      }
    },
    [state],
  );

  const toRequest = useCallback(
    (mode: 'draft' | 'full' = 'full'): CreateBountyRequest => buildCreateBountyRequest(state, mode),
    [state],
  );

  return {
    state,
    dispatch,
    perClaimRewardValue,
    totalRewardValue,
    validate,
    handleBlur,
    toRequest,
  };
}
