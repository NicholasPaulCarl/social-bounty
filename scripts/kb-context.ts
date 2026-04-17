#!/usr/bin/env node
/**
 * kb-context — Phase 4 Claude tooling.
 *
 * Prints the top-N most relevant Knowledge Base entries for a given file path,
 * system name, or root-cause signature. Output is shaped to be pasted directly
 * into a Claude prompt (per `claude.md` §11) before proposing any payment-
 * related fix.
 *
 * Sources (both are queried; results are merged and ranked):
 *   1. md-files/knowledge-base.md  — narrative entries (headers like
 *      `## [KB-YYYY-MM-DD-###] Title`, with Type/Severity/System/Module fields).
 *   2. `recurring_issues` DB table  — live runtime stubs from reconciliation
 *      and webhook failures.
 *
 * Usage (from repo root):
 *   npx tsx scripts/kb-context.ts --path apps/api/src/modules/payouts/payouts.service.ts
 *   npx tsx scripts/kb-context.ts --system payments
 *   npx tsx scripts/kb-context.ts --signature <hex>
 *   npx tsx scripts/kb-context.ts --path ... --limit 5 --output json
 *
 * If `tsx` is unavailable, the following also work:
 *   npx ts-node scripts/kb-context.ts ...
 *   (or) tsc scripts/kb-context.ts --outDir dist-scripts && node dist-scripts/kb-context.js ...
 *
 * If the database is unreachable, the script gracefully degrades and prints
 * only md-files matches with a warning on stderr.
 */
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OutputFormat = 'md' | 'json';

export interface CliArgs {
  path?: string;
  system?: string;
  signature?: string;
  limit: number;
  output: OutputFormat;
  kbFile: string;
}

export interface KbFileEntry {
  source: 'kb-file';
  id: string; // e.g. KB-2026-04-15-001
  title: string;
  type?: string;
  severity?: string;
  system?: string;
  module?: string;
  tags: string[];
  filesAffected: string[];
  rootCause?: string;
  fixApplied?: string;
  summary?: string;
  recurrenceCount: number;
  resolved: boolean;
  rawBody: string; // full markdown body for keyword fallback matching
}

export interface RecurringIssueRow {
  id: string;
  category: string;
  signature: string;
  title: string;
  severity: string;
  occurrences: number;
  resolved: boolean;
  resolvedAt: Date | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  rootCause: string | null;
  mitigation: string | null;
  kbEntryRef: string | null;
  metadata: unknown;
}

export interface ScoredEntry {
  score: number;
  kind: 'kb' | 'ri';
  id: string;
  title: string;
  category?: string;
  system?: string;
  severity?: string;
  occurrences: number;
  resolved: boolean;
  lastSeenAt?: Date;
  guidance: string; // "what to know before fixing"
  kbEntryRef?: string | null;
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    limit: 10,
    output: 'md',
    kbFile: path.resolve(__dirname, '..', 'md-files', 'knowledge-base.md'),
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const next = argv[i + 1];
    switch (token) {
      case '--path':
        args.path = next;
        i++;
        break;
      case '--system':
        args.system = next;
        i++;
        break;
      case '--signature':
        args.signature = next;
        i++;
        break;
      case '--limit':
        args.limit = Math.max(1, parseInt(next, 10) || 10);
        i++;
        break;
      case '--output':
        args.output = (next === 'json' ? 'json' : 'md') as OutputFormat;
        i++;
        break;
      case '--kb-file':
        args.kbFile = path.resolve(next);
        i++;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        if (token.startsWith('--')) {
          // Unknown flag — ignore silently so we don't block CI.
        }
        break;
    }
  }

  if (!args.path && !args.system && !args.signature) {
    printUsage();
    throw new Error('one of --path, --system, --signature is required');
  }

  return args;
}

function printUsage(): void {
  const msg = [
    'Usage: npx tsx scripts/kb-context.ts [--path <file>] [--system <name>]',
    '                                    [--signature <hex>] [--limit N] [--output md|json]',
    '',
    'Exactly one of --path | --system | --signature is required.',
  ].join('\n');
  // eslint-disable-next-line no-console
  console.log(msg);
}

// ---------------------------------------------------------------------------
// md-files/knowledge-base.md parser
// ---------------------------------------------------------------------------

/**
 * Extract entries from the KB markdown file. Entries start with a header of
 * the form `## [KB-YYYY-MM-DD-###] <Title>` and are separated by horizontal
 * rules or the next such header.
 *
 * Anything before the `## Entries` marker (schema, template, worked example)
 * is intentionally included — the example at the bottom of the template
 * section is a real worked example and a valid reference.
 */
export function parseKbFile(contents: string): KbFileEntry[] {
  const entries: KbFileEntry[] = [];
  const headerRe = /^##\s+\[(KB-\d{4}-\d{2}-\d{2}-\d{3})\]\s+(.+?)\s*$/gm;

  const matches: { id: string; title: string; start: number; headerEnd: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(contents)) !== null) {
    matches.push({
      id: m[1],
      title: m[2].trim(),
      start: m.index,
      headerEnd: m.index + m[0].length,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nextStart = i + 1 < matches.length ? matches[i + 1].start : contents.length;
    const body = contents.slice(cur.headerEnd, nextStart);
    entries.push(buildKbEntry(cur.id, cur.title, body));
  }

  return entries;
}

function buildKbEntry(id: string, title: string, body: string): KbFileEntry {
  const field = (name: string): string | undefined => {
    const re = new RegExp(`^\\s*${name}\\s*:\\s*(.+?)\\s*$`, 'mi');
    const match = body.match(re);
    return match ? match[1].trim() : undefined;
  };

  const section = (name: string): string | undefined => {
    // Pull the paragraph under `### <name>` until the next `### ` / `## ` / EOF.
    const re = new RegExp(`###\\s+${name}\\s*\\n([\\s\\S]*?)(?=\\n###\\s|\\n##\\s|$)`, 'i');
    const match = body.match(re);
    return match ? match[1].trim() : undefined;
  };

  const tagsRaw = field('Tags');
  const tags = tagsRaw
    ? tagsRaw
        .split(/[,\s]+/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const filesSection = section('Files / Services Affected') ?? '';
  const filesAffected = filesSection
    .split('\n')
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('('));

  const outcome = (field('Outcome') ?? section('Outcome') ?? '').toLowerCase();
  const resolved = /resolved/.test(outcome);

  const patternType = field('Pattern Classification') ?? section('Pattern Classification') ?? '';
  const recurrenceMatch = patternType.match(/(\d+)/);
  // If there's no numeric recurrence in the KB file we treat it as 1 (seen once).
  const recurrenceCount = recurrenceMatch ? parseInt(recurrenceMatch[1], 10) : 1;

  return {
    source: 'kb-file',
    id,
    title,
    type: field('Type'),
    severity: field('Severity'),
    system: field('System'),
    module: field('Module'),
    tags,
    filesAffected,
    rootCause: section('Root Cause'),
    fixApplied: section('Action Taken') ?? section('Fix Applied'),
    summary: section('Summary'),
    recurrenceCount,
    resolved,
    rawBody: body,
  };
}

// ---------------------------------------------------------------------------
// Relevance matching
// ---------------------------------------------------------------------------

/**
 * True if `candidate` path is the same as `query` or sits beneath a directory
 * that `query` references. Both paths are normalised to forward slashes and
 * stripped of any leading `./` or `/`.
 */
export function pathNestedMatch(queryPath: string, candidate: string): boolean {
  const normalise = (p: string) =>
    p
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\.\//, '')
      .replace(/^\//, '')
      .replace(/\/+$/, '');

  const q = normalise(queryPath);
  const c = normalise(candidate);
  if (!q || !c) return false;
  if (q === c) return true;

  // File vs directory: candidate is a directory and query file lives under it.
  if (c.endsWith('/') || !/\.[a-zA-Z0-9]+$/.test(c)) {
    const dir = c.replace(/\/+$/, '') + '/';
    if (q.startsWith(dir)) return true;
  }
  // Same idea the other way (the KB entry lists a specific file and the query
  // is that file or an ancestor directory of it).
  if (q.endsWith('/') || !/\.[a-zA-Z0-9]+$/.test(q)) {
    const dir = q.replace(/\/+$/, '') + '/';
    if (c.startsWith(dir)) return true;
  }
  // Basename fallback: query is just `payouts.service.ts` and the KB mentions
  // the full path somewhere.
  const qBase = q.split('/').pop()!;
  const cBase = c.split('/').pop()!;
  if (qBase === cBase) return true;

  return false;
}

export interface ScoreInput {
  path?: string;
  system?: string;
  signature?: string;
}

/**
 * Score a KB file entry against the query. Higher is more relevant.
 * Open (not resolved) entries outrank resolved ones, and within each bucket
 * higher recurrenceCount wins; lastSeenAt is used only for DB rows.
 */
export function scoreKbFileEntry(entry: KbFileEntry, q: ScoreInput): number {
  let matchScore = 0;

  if (q.path) {
    const fileHit = entry.filesAffected.some((f) => pathNestedMatch(q.path!, f));
    if (fileHit) matchScore += 100;
    // Body fallback — entry mentions the path (or its basename) in prose.
    const basename = q.path.split(/[\\/]/).pop() ?? '';
    if (!fileHit && basename && entry.rawBody.toLowerCase().includes(basename.toLowerCase())) {
      matchScore += 40;
    }
  }

  if (q.system) {
    const sys = q.system.toLowerCase();
    if ((entry.system ?? '').toLowerCase() === sys) matchScore += 100;
    else if ((entry.module ?? '').toLowerCase().includes(sys)) matchScore += 50;
    else if (entry.tags.includes(sys)) matchScore += 40;
  }

  if (q.signature) {
    // md-files entries rarely carry a signature hash but may reference one in
    // prose; exact string match only.
    if (entry.rawBody.includes(q.signature)) matchScore += 100;
  }

  // Only apply structural / recurrence tie-breaker bonuses when the entry
  // actually matched the query — otherwise a totally unrelated entry would
  // always come back with a non-zero score.
  if (matchScore <= 0) return 0;

  let score = matchScore;
  if (/recurring|structural/i.test(entry.rawBody.match(/Pattern Classification[\s\S]{0,80}/i)?.[0] ?? '')) {
    score += 10;
  }
  if (!entry.resolved) score += 5;
  score += Math.min(entry.recurrenceCount, 10);
  return score;
}

export function scoreRecurringIssue(row: RecurringIssueRow, q: ScoreInput): number {
  let matchScore = 0;
  const meta = (row.metadata as Record<string, unknown> | null) ?? {};
  const metaSystem = typeof meta.system === 'string' ? (meta.system as string) : '';
  const metaPaths = Array.isArray(meta.paths) ? (meta.paths as string[]) : [];
  const metaPath = typeof meta.path === 'string' ? (meta.path as string) : '';
  const allPaths = [...metaPaths, metaPath].filter(Boolean);

  if (q.path) {
    const hit = allPaths.some((p) => pathNestedMatch(q.path!, p));
    if (hit) matchScore += 100;
  }

  if (q.system) {
    const sys = q.system.toLowerCase();
    if (metaSystem.toLowerCase() === sys) matchScore += 100;
    else if (row.category.toLowerCase().includes(sys)) matchScore += 40;
  }

  if (q.signature) {
    if (row.signature === q.signature) matchScore += 200;
  }

  if (matchScore <= 0) return 0;

  let score = matchScore;
  if (!row.resolved) score += 10;
  score += Math.min(row.occurrences, 10);
  return score;
}

// ---------------------------------------------------------------------------
// Ranking + output
// ---------------------------------------------------------------------------

export function rankEntries(
  kbEntries: KbFileEntry[],
  riRows: RecurringIssueRow[],
  q: ScoreInput,
  limit: number,
): ScoredEntry[] {
  const scored: ScoredEntry[] = [];

  for (const e of kbEntries) {
    const score = scoreKbFileEntry(e, q);
    if (score <= 0) continue;
    scored.push({
      score,
      kind: 'kb',
      id: e.id,
      title: e.title,
      category: e.type,
      system: e.system,
      severity: e.severity,
      occurrences: e.recurrenceCount,
      resolved: e.resolved,
      guidance: deriveGuidance(e.rootCause, e.summary, e.fixApplied, e.title),
    });
  }

  for (const r of riRows) {
    const score = scoreRecurringIssue(r, q);
    if (score <= 0) continue;
    scored.push({
      score,
      kind: 'ri',
      id: `RI-${r.id}`,
      title: r.title,
      category: r.category,
      system: extractMetaSystem(r.metadata),
      severity: r.severity,
      occurrences: r.occurrences,
      resolved: r.resolved,
      lastSeenAt: r.lastSeenAt,
      guidance: deriveGuidance(r.rootCause, null, r.mitigation, r.title),
      kbEntryRef: r.kbEntryRef,
    });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    if (a.occurrences !== b.occurrences) return b.occurrences - a.occurrences;
    const aT = a.lastSeenAt ? a.lastSeenAt.getTime() : 0;
    const bT = b.lastSeenAt ? b.lastSeenAt.getTime() : 0;
    return bT - aT;
  });

  return scored.slice(0, limit);
}

function extractMetaSystem(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const value = (metadata as Record<string, unknown>).system;
  return typeof value === 'string' ? value : undefined;
}

function deriveGuidance(
  rootCause: string | null | undefined,
  summary: string | null | undefined,
  mitigation: string | null | undefined,
  title: string,
): string {
  const parts: string[] = [];
  if (rootCause && rootCause.trim()) parts.push(`Root cause: ${compact(rootCause)}`);
  if (mitigation && mitigation.trim()) parts.push(`Mitigation: ${compact(mitigation)}`);
  if (!parts.length && summary && summary.trim()) parts.push(compact(summary));
  if (!parts.length) parts.push(title);
  return parts.join(' ');
}

function compact(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/^-\s+/, '')
    .trim();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function renderMarkdown(entries: ScoredEntry[], q: CliArgs, warnings: string[]): string {
  const lines: string[] = [];
  lines.push('# KB Context for Claude');
  lines.push('');
  lines.push(`Query: ${describeQuery(q)}`);
  lines.push(`Matches: ${entries.length} (limit ${q.limit})`);
  if (warnings.length) {
    lines.push('');
    for (const w of warnings) lines.push(`> WARNING: ${w}`);
  }
  lines.push('');

  if (!entries.length) {
    lines.push('_No matching KB entries — proceed with caution and log a new KB entry if this turns out to be a known pattern._');
    return lines.join('\n');
  }

  for (const e of entries) {
    lines.push(`## ${e.id} — ${e.title}`);
    const meta = [
      e.category ? `category: ${e.category}` : null,
      e.system ? `system: ${e.system}` : null,
      e.severity ? `severity: ${e.severity}` : null,
      `occurrences: ${e.occurrences}`,
      `status: ${e.resolved ? 'resolved' : 'open'}`,
      e.kbEntryRef ? `kbEntryRef: ${e.kbEntryRef}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    lines.push(`- ${meta}`);
    lines.push('');
    lines.push(`**What to know before fixing:** ${e.guidance}`);
    lines.push('');
  }
  return lines.join('\n');
}

function describeQuery(q: CliArgs): string {
  const parts: string[] = [];
  if (q.path) parts.push(`path=${q.path}`);
  if (q.system) parts.push(`system=${q.system}`);
  if (q.signature) parts.push(`signature=${q.signature}`);
  return parts.join(' ') || '(none)';
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

export function readKbFile(filePath: string): KbFileEntry[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return parseKbFile(raw);
}

/**
 * Load RecurringIssue rows from the DB if reachable. Returns an empty array
 * and records a warning if the DB is unavailable. We lazy-require the Prisma
 * client so that non-DB test/CI invocations work without DATABASE_URL.
 */
export async function readRecurringIssues(
  warnings: string[],
): Promise<RecurringIssueRow[]> {
  let PrismaClientCtor: any;
  const candidatePaths = [
    '@prisma/client',
    path.resolve(__dirname, '..', 'apps/api/node_modules/@prisma/client'),
    path.resolve(__dirname, '..', 'packages/prisma/node_modules/@prisma/client'),
  ];
  for (const candidate of candidatePaths) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(candidate);
      if (mod && mod.PrismaClient) {
        PrismaClientCtor = mod.PrismaClient;
        break;
      }
    } catch {
      // try next candidate
    }
  }
  if (!PrismaClientCtor) {
    warnings.push('@prisma/client not installed — skipping DB lookup.');
    return [];
  }

  const prisma = new PrismaClientCtor();
  try {
    const rows = await prisma.recurringIssue.findMany({
      orderBy: [{ resolved: 'asc' }, { occurrences: 'desc' }, { lastSeenAt: 'desc' }],
      take: 500,
    });
    return rows as RecurringIssueRow[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const detail = msg.split('\n').map((l) => l.trim()).filter(Boolean)[0] ?? 'unknown error';
    warnings.push(`DB unreachable, md-files matches only (${detail}).`);
    return [];
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      /* ignore */
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  const warnings: string[] = [];

  const kbEntries = readKbFile(args.kbFile);
  const riRows = await readRecurringIssues(warnings);

  const q: ScoreInput = { path: args.path, system: args.system, signature: args.signature };
  const ranked = rankEntries(kbEntries, riRows, q, args.limit);

  if (args.output === 'json') {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          query: q,
          limit: args.limit,
          warnings,
          matches: ranked,
        },
        null,
        2,
      ),
    );
  } else {
    // eslint-disable-next-line no-console
    console.log(renderMarkdown(ranked, args, warnings));
  }

  return 0;
}

// Only execute when invoked directly (not when imported by the spec file).
if (require.main === module) {
  run(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
