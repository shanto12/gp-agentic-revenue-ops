import type { KnowledgeDoc } from './types'
import { brandVoiceDoc } from '../data/brand-voice'
import { icpDoc } from '../data/icp'
import { battlecards } from '../data/battlecards'

export const corpus: KnowledgeDoc[] = [icpDoc, brandVoiceDoc, ...battlecards]

export interface RagHit {
  doc: KnowledgeDoc
  score: number
  matchedTerms: string[]
  excerpt: string
}

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'for',
  'with',
  'is',
  'are',
  'we',
  'you',
  'your',
])

function tokenize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
}

export function retrieve(
  query: string,
  opts: { kinds?: KnowledgeDoc['kind'][]; topK?: number } = {},
): RagHit[] {
  const queryTerms = new Set(tokenize(query))
  const docs = opts.kinds ? corpus.filter((d) => opts.kinds!.includes(d.kind)) : corpus
  const hits: RagHit[] = docs.map((doc) => {
    const docTerms = tokenize(doc.title + ' ' + doc.bodyMarkdown)
    const matched: string[] = []
    let overlap = 0
    for (const term of queryTerms) {
      if (docTerms.includes(term)) {
        overlap += 1
        matched.push(term)
      }
    }
    const denom = Math.sqrt(queryTerms.size * Math.max(1, new Set(docTerms).size))
    const score = denom === 0 ? 0 : overlap / denom

    const lines = doc.bodyMarkdown.split('\n')
    const ranked = lines
      .map((line, idx) => {
        const lineTerms = tokenize(line)
        const hits = lineTerms.filter((t) => queryTerms.has(t)).length
        return { line, idx, hits }
      })
      .sort((a, b) => b.hits - a.hits)
    const excerpt =
      ranked[0] && ranked[0].hits > 0
        ? ranked[0].line.trim()
        : (lines[2] ?? '').trim()

    return { doc, score, matchedTerms: matched, excerpt }
  })

  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, opts.topK ?? 3)
}
