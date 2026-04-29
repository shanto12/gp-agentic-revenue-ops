import { corpus } from '../lib/rag'
import { Icon } from './Icon'

const KIND_LABEL: Record<string, string> = {
  'brand-voice': 'Brand voice',
  icp: 'ICP definition',
  battlecard: 'Battlecard',
  compliance: 'Compliance',
}

export function KnowledgeScreen() {
  return (
    <div className="page" aria-labelledby="kn-h1">
      <h1 id="kn-h1" className="page__h1">Knowledge</h1>
      <p className="page__sub">
        Retrieval corpus for the agent. Synthetic, version-stamped, and citable. Every nurture
        draft must cite at least one of these documents in <code>brandVoiceCitations</code> or{' '}
        <code>personalisationCitations</code>.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14, marginTop: 14 }}>
        {corpus.map((doc) => (
          <article key={doc.id} className="card">
            <div className="card__head">
              <Icon name="knowledge" size={13} />
              <span className="card__title">{doc.title}</span>
              <span className="tb__spacer" />
              <span className="kbd">{KIND_LABEL[doc.kind] ?? doc.kind}</span>
            </div>
            <div className="card__body">
              <p className="page__sub" style={{ margin: '0 0 8px' }}>
                Updated {doc.updatedAt} · <span className="mono">{doc.id}</span>
              </p>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--t-mono)',
                  fontSize: 11.5,
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  padding: '10px 12px',
                  borderRadius: 4,
                  maxHeight: 280,
                  overflow: 'auto',
                }}
              >
                {doc.bodyMarkdown}
              </pre>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
