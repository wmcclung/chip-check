import { useState, useEffect, useCallback, useRef } from 'react'
import { CAMPAIGN_1, ARTIFACTS, DECISION_ECHOES, SPECIAL_NARRATIVES } from '../../quest.js'
import * as ADV from '../../adventureDays.js'
import { RIVIAN_ENTRIES, RIVIAN_DAYS } from '../../rivianEntries.js'

// ── Bridge scene stubs ────────────────────────────────────────────────────────

const BRIDGE_SCENES = {
  'will|man':      'Bridge scene: Will has the vial · Dream: The Man You Wanted To Be\nFull scene text in forgetting_bridge_scenes.docx',
  'will|known':    'Bridge scene: Will has the vial · Dream: To Be Known\nFull scene text in forgetting_bridge_scenes.docx',
  'will|last':     'Bridge scene: Will has the vial · Dream: To Last\nFull scene text in forgetting_bridge_scenes.docx',
  'will|before':   'Bridge scene: Will has the vial · Dream: Before\nFull scene text in forgetting_bridge_scenes.docx',
  'brent|man':     'Bridge scene: Brent has the vial · Dream: The Man You Wanted To Be\nFull scene text in forgetting_bridge_scenes.docx',
  'brent|known':   'Bridge scene: Brent has the vial · Dream: To Be Known\nFull scene text in forgetting_bridge_scenes.docx',
  'brent|last':    'Bridge scene: Brent has the vial · Dream: To Last\nFull scene text in forgetting_bridge_scenes.docx',
  'brent|before':  'Bridge scene: Brent has the vial · Dream: Before\nFull scene text in forgetting_bridge_scenes.docx',
  'kevin|man':     'Bridge scene: Kevin has the vial · Dream: The Man You Wanted To Be\nFull scene text in forgetting_bridge_scenes.docx',
  'kevin|known':   'Bridge scene: Kevin has the vial · Dream: To Be Known\nFull scene text in forgetting_bridge_scenes.docx',
  'kevin|last':    'Bridge scene: Kevin has the vial · Dream: To Last\nFull scene text in forgetting_bridge_scenes.docx',
  'kevin|before':  'Bridge scene: Kevin has the vial · Dream: Before\nFull scene text in forgetting_bridge_scenes.docx',
  'kept|man':      'Bridge scene: Chip kept the vial · Dream: The Man You Wanted To Be\nFull scene text in forgetting_bridge_scenes.docx',
  'kept|known':    'Bridge scene: Chip kept the vial · Dream: To Be Known\nFull scene text in forgetting_bridge_scenes.docx',
  'kept|last':     'Bridge scene: Chip kept the vial · Dream: To Last\nFull scene text in forgetting_bridge_scenes.docx',
  'kept|before':   'Bridge scene: Chip kept the vial · Dream: Before\nFull scene text in forgetting_bridge_scenes.docx',
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ADVENTURE_DAYS_SET = new Set([7, 12, 13, 18, 22, 24, 27, 32, 34, 39, 42, 52, 57])

const TIER_LABELS = { blazing: 'Blazing', great: 'Great', good: 'Good', struggle: 'Struggle' }

// Build scheduled-by-day map once
const scheduledByDay = {}
for (const ch of CAMPAIGN_1.chapters) {
  for (const s of (ch.scheduled || [])) {
    scheduledByDay[s.quest_day] = s
  }
}

// ── Adventure variant key resolver ───────────────────────────────────────────
// Resolves the correct key in an ADV.DAY_N object given tier + derived flags.
// Flags default to the "best case" (blazing earned everything) so the archive
// shows the richest variant when no flag context is available.

function getAdvVariantKey(dayNum, tier, flags = {}) {
  const {
    hasLetter      = true,
    miraTip        = true,
    fogmereRiddle  = true,
    knowsSenna     = true,
    knowsRoan      = tier === 'blazing', // only blazing unlocks roan
    knowsMaren     = tier !== 'struggle',
    birdEncountered = tier !== 'struggle',
  } = flags

  switch (dayNum) {
    case 7:  return tier
    case 12: {
      if (tier === 'blazing' || tier === 'great') return 'blazing_great'
      if (tier === 'good') return miraTip ? 'good_with_tip' : 'good_no_tip'
      return 'struggle'
    }
    case 13: {
      const prefix = fogmereRiddle ? 'has_riddle' : 'no_riddle'
      return `${prefix}_${tier}`
    }
    case 18: {
      const suffix = hasLetter ? 'with_letter' : 'no_letter'
      return `${tier}_${suffix}`
    }
    case 22: return tier
    case 24: {
      if (knowsSenna) return `knows_${tier}`
      return `doesnt_know_${tier}`
    }
    case 27: return tier === 'struggle' ? 'struggle' : 'blazing_great_good'
    case 32: return tier
    case 34: return birdEncountered ? 'bird_encountered' : 'bird_not_encountered'
    case 39: return tier === 'struggle' ? 'struggle' : 'blazing_great_good'
    case 42: {
      if (tier === 'struggle') return 'struggle'
      if (knowsMaren) return 'knows_maren'
      if (knowsSenna) return 'knows_senna_not_maren'
      return 'doesnt_know_senna'
    }
    case 52: {
      if (knowsRoan) return 'knows_roan'
      return tier === 'blazing' ? 'doesnt_know_blazing' : 'doesnt_know_other'
    }
    case 57: return (tier === 'blazing' || tier === 'great') ? 'blazing_great' : 'good_struggle'
    default: return tier
  }
}

function getAdvText(dayNum, tier) {
  const dayObj = ADV[`DAY_${dayNum}`]
  if (!dayObj) return null
  const key = getAdvVariantKey(dayNum, tier)
  return dayObj[key] || null
}

// ── hasFilters ────────────────────────────────────────────────────────────────

function hasFilters(day) {
  if (ADVENTURE_DAYS_SET.has(day)) return true
  if (day === 15) return true   // vial choice
  if (day === 25) return true   // nature observation
  if (day === 35) return true   // halvard exit
  if (day === 40) return true   // dream choice
  if (day === 45) return true   // emoji choice
  if (day >= 46 && day <= 50) return true  // forgetting context
  if (day === 60) return true   // chronicle choice
  return false
}

// ── FilterPill ────────────────────────────────────────────────────────────────

const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
      active
        ? 'bg-stone-700 text-amber-400 ring-1 ring-amber-500'
        : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
    }`}
  >
    {label}
  </button>
)

// ── Prose block ───────────────────────────────────────────────────────────────

const ProseBlock = ({ text }) => (
  <p className="whitespace-pre-line leading-relaxed text-stone-200 font-serif text-[15px]">
    {text}
  </p>
)

const SectionLabel = ({ children }) => (
  <div className="text-xs uppercase tracking-widest text-stone-500 font-sans mb-2">{children}</div>
)

const Divider = () => <hr className="border-t border-stone-800 my-6" />

// ── Dot indicator ─────────────────────────────────────────────────────────────

function DayDots({ day }) {
  const chapter = CAMPAIGN_1.chapters.find(c => day >= c.days[0] && day <= c.days[1])
  const dots = []
  if (scheduledByDay[day])           dots.push(<span key="s" className="w-1.5 h-1.5 rounded-sm bg-blue-500 inline-block" />)
  if (ADVENTURE_DAYS_SET.has(day))   dots.push(<span key="a" className="w-1.5 h-1.5 rounded-sm bg-orange-400 inline-block" />)
  if (RIVIAN_DAYS.includes(day))     dots.push(<span key="r" className="w-1.5 h-1.5 rounded-sm bg-purple-400 inline-block" />)
  if (day % 5 === 0)                 dots.push(<span key="m" className="w-1.5 h-1.5 rounded-sm bg-amber-400 inline-block" />)
  if (day % 5 === 0 && chapter?.decision) dots.push(<span key="d" className="w-1.5 h-1.5 rounded-sm bg-violet-500 inline-block" />)
  return <span className="flex gap-0.5 items-center">{dots}</span>
}

// ── Chapter sidebar list ──────────────────────────────────────────────────────

function ChapterList({ currentDay, onSelectDay }) {
  return (
    <div className="py-4">
      <div className="px-4 pb-3 text-[11px] font-semibold uppercase tracking-widest text-amber-500" style={{ fontVariant: 'small-caps' }}>
        The Emberstone Chronicles
      </div>
      {CAMPAIGN_1.chapters.map(ch => {
        const active = currentDay >= ch.days[0] && currentDay <= ch.days[1]
        return (
          <div key={ch.number} className="mb-1">
            <button
              onClick={() => onSelectDay(ch.days[0])}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                active ? 'text-amber-500 bg-stone-800' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <div className="font-medium">Ch. {ch.number}</div>
              <div className="text-[11px] text-stone-500 truncate">{ch.title}</div>
              <div className="text-[10px] text-stone-600">Days {ch.days[0]}–{ch.days[1]}</div>
            </button>
            {active && (
              <div className="pl-6 pb-1">
                {Array.from({ length: ch.days[1] - ch.days[0] + 1 }, (_, i) => ch.days[0] + i).map(d => (
                  <button
                    key={d}
                    onClick={() => onSelectDay(d)}
                    className={`flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-xs transition-colors ${
                      d === currentDay ? 'text-amber-500 font-semibold' : 'text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    <span className="w-5">{d}</span>
                    <DayDots day={d} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Nav bar ───────────────────────────────────────────────────────────────────

function NavBar({ currentDay, onPrev, onNext, position }) {
  const isFirst = currentDay === 1
  const isLast  = currentDay === 60
  const stickyClass = position === 'top'
    ? 'sticky top-0 bg-stone-950 pb-4 pt-4 z-10 border-b border-stone-900'
    : 'sticky bottom-0 bg-stone-950 pt-4 pb-6 border-t border-stone-900'

  return (
    <div className={`flex items-center justify-between ${stickyClass}`}>
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="px-3 py-1.5 rounded bg-stone-800 text-stone-300 text-sm hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Prev
      </button>
      <span className="text-stone-400 text-sm tabular-nums">Day {currentDay} of 60</span>
      {isLast
        ? <span className="px-3 py-1.5 text-amber-500 text-sm font-medium">Chronicle Complete</span>
        : (
          <button
            onClick={onNext}
            className="px-3 py-1.5 rounded bg-stone-800 text-stone-300 text-sm hover:bg-stone-700 transition-colors"
          >
            Next →
          </button>
        )
      }
    </div>
  )
}

// ── Filter panel ──────────────────────────────────────────────────────────────

function FilterPanel({
  currentDay, currentChapter,
  selectedTier, setSelectedTier,
  vialRecipient, setVialRecipient,
  dreamChoice, setDreamChoice,
  natureObs, setNatureObs,
  halvardExit, setHalvardExit,
  emojiChoice, setEmojiChoice,
  chronicleChoice, setChronicleChoice,
  onGoToDay,
  mobile = false,
}) {
  const wrapClass = mobile
    ? 'mt-8 pt-6 border-t border-stone-800'
    : 'w-64 flex-shrink-0 bg-stone-900 border-l border-stone-800 overflow-y-auto'

  const inner = (
    <div className="p-4">
      <div className="text-amber-400 font-medium text-sm mb-1">Explore outcomes</div>
      <div className="text-stone-500 text-xs mb-5">See what this day could have shown</div>

      {/* Tier filter — all adventure days */}
      {ADVENTURE_DAYS_SET.has(currentDay) && (
        <FilterGroup label="Wake time">
          {['blazing', 'great', 'good', 'struggle'].map(t => (
            <FilterPill key={t} label={TIER_LABELS[t]} active={selectedTier === t} onClick={() => setSelectedTier(t)} />
          ))}
        </FilterGroup>
      )}

      {/* Day 15 — vial */}
      {currentDay === 15 && (
        <>
          <FilterGroup label="Who carries the vial?">
            {[['will', 'Will'], ['brent', 'Brent'], ['kevin', 'Kevin'], ['kept', 'Kept it']].map(([v, l]) => (
              <FilterPill key={v} label={l} active={vialRecipient === v} onClick={() => setVialRecipient(v)} />
            ))}
          </FilterGroup>
          <Callout>This choice affects the Ch.10 bridge scene</Callout>
        </>
      )}

      {/* Day 25 — nature observation */}
      {currentDay === 25 && (
        <FilterGroup label="What does Chip describe?">
          {[
            ['Charidotella sexpunctata', 'C. sexpunctata'],
            ['Laetiporus sulphureus',   'L. sulphureus'],
            ['Osmundastrum claytoniana','O. claytoniana'],
            ['Ambystoma maculatum',     'A. maculatum'],
          ].map(([v, l]) => (
            <FilterPill key={v} label={l} active={natureObs === v} onClick={() => setNatureObs(v)} />
          ))}
        </FilterGroup>
      )}

      {/* Day 35 — halvard exit */}
      {currentDay === 35 && (
        <FilterGroup label="How does Chip leave Halvard?">
          {[
            ['nods',    'Nods sincerely'],
            ['log',     'Throws a log'],
            ['thanks',  'Thanks Halvard'],
          ].map(([v, l]) => (
            <FilterPill key={v} label={l} active={halvardExit === v} onClick={() => setHalvardExit(v)} />
          ))}
        </FilterGroup>
      )}

      {/* Day 40 — dream choice */}
      {currentDay === 40 && (
        <>
          <FilterGroup label="What does the Pull offer?">
            {[
              ['man',   'The Man You Wanted To Be'],
              ['known', 'To Be Known'],
              ['last',  'To Last'],
              ['before','Before'],
            ].map(([v, l]) => (
              <FilterPill key={v} label={l} active={dreamChoice === v} onClick={() => setDreamChoice(v)} />
            ))}
          </FilterGroup>
          <Callout>This choice determines the bridge scene in Ch.10</Callout>
        </>
      )}

      {/* Day 45 — emoji choice */}
      {currentDay === 45 && (
        <FilterGroup label="Which emoji does Chip send?">
          {[
            ['mountain_eyes_fire', '🏔️👀🔥'],
            ['eggplant',           '🍆💦😩'],
            ['crying_mountain',    '😭🏔️😭'],
            ['pregnant',           '🫃🪬🫏⁉️'],
          ].map(([v, l]) => (
            <FilterPill key={v} label={l} active={emojiChoice === v} onClick={() => setEmojiChoice(v)} />
          ))}
        </FilterGroup>
      )}

      {/* Ch.10 days 46-50 — show vial + dream read-only */}
      {currentDay >= 46 && currentDay <= 50 && (
        <div className="space-y-3">
          <div className="text-stone-500 text-xs uppercase tracking-wider mb-2">Bridge Context</div>
          <div className="text-sm text-stone-300">
            Vial:{' '}
            {vialRecipient
              ? <span className="text-amber-400 capitalize">{vialRecipient === 'kept' ? 'Kept it' : vialRecipient}</span>
              : <button className="text-amber-600 underline hover:text-amber-400" onClick={() => onGoToDay(15)}>← Set in Chapter 3</button>
            }
          </div>
          <div className="text-sm text-stone-300">
            Dream:{' '}
            {dreamChoice
              ? <span className="text-amber-400">{
                  { man: 'The Man You Wanted To Be', known: 'To Be Known', last: 'To Last', before: 'Before' }[dreamChoice]
                }</span>
              : <button className="text-amber-600 underline hover:text-amber-400" onClick={() => onGoToDay(40)}>← Set in Chapter 8</button>
            }
          </div>
        </div>
      )}

      {/* Day 60 — chronicle */}
      {currentDay === 60 && (
        <FilterGroup label="Before the summit">
          {[
            ['read',    'Read the chronicle'],
            ['forward', 'Go up without looking back'],
          ].map(([v, l]) => (
            <FilterPill key={v} label={l} active={chronicleChoice === v} onClick={() => setChronicleChoice(v)} />
          ))}
        </FilterGroup>
      )}
    </div>
  )

  return <div className={wrapClass}>{inner}</div>
}

function FilterGroup({ label, children }) {
  return (
    <div className="mb-5">
      <div className="text-stone-400 text-xs font-medium uppercase tracking-wide mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Callout({ children }) {
  return (
    <div className="mb-4 px-3 py-2 rounded bg-amber-950/40 border border-amber-900/40 text-amber-500/80 text-xs">
      {children}
    </div>
  )
}

// ── Day content ───────────────────────────────────────────────────────────────

function DayContent({
  currentDay, currentChapter,
  selectedTier,
  vialRecipient, dreamChoice, natureObs, halvardExit, emojiChoice, chronicleChoice,
}) {
  const sections = []

  // 1. Scheduled entry
  const scheduled = scheduledByDay[currentDay]
  if (scheduled) {
    sections.push(
      <div key="scheduled">
        <SectionLabel>[ Scheduled ]</SectionLabel>
        <ProseBlock text={scheduled.text} />
      </div>
    )
  }

  // 2. Adventure day
  if (ADVENTURE_DAYS_SET.has(currentDay)) {
    const advText = getAdvText(currentDay, selectedTier)
    if (advText) {
      sections.push(
        <div key="adventure">
          <SectionLabel>[ Adventure — {selectedTier.toUpperCase()} ]</SectionLabel>
          <ProseBlock text={advText} />
        </div>
      )
    }
  }

  // 3. Rivian entry
  const rivianIdx = RIVIAN_DAYS.indexOf(currentDay)
  if (rivianIdx !== -1 && RIVIAN_ENTRIES[rivianIdx]) {
    sections.push(
      <div key="rivian">
        <SectionLabel>[ Rivian ]</SectionLabel>
        <ProseBlock text={RIVIAN_ENTRIES[rivianIdx]} />
      </div>
    )
  }

  // 4. Milestone
  if (currentDay % 5 === 0 && currentChapter) {
    sections.push(
      <div key="milestone">
        <SectionLabel>[ Chapter Complete — Day {currentDay} ]</SectionLabel>
        <ProseBlock text={currentChapter.milestone} />
      </div>
    )
  }

  // 5. Artifact
  if (currentDay % 5 === 0 && currentChapter?.artifact_awarded) {
    const artifact = ARTIFACTS[currentChapter.artifact_awarded]
    if (artifact) {
      sections.push(
        <div key="artifact">
          <SectionLabel>[ Artifact ]</SectionLabel>
          <div className="rounded border border-amber-900/40 bg-amber-950/20 px-4 py-3">
            <div className="text-amber-400 font-medium text-sm mb-1">{artifact.name}</div>
            <p className="text-stone-300 text-sm leading-relaxed font-serif">{artifact.description}</p>
          </div>
        </div>
      )
    }
  }

  // 6. Decision
  if (currentDay % 5 === 0 && currentChapter?.decision) {
    const { prompt, choices } = currentChapter.decision
    const chKey = `c${currentChapter.number}`
    const activeChoice = {
      c3: vialRecipient,
      c8: dreamChoice ? `c8_${dreamChoice}` : null,
      c9: null, // emoji doesn't map to c9 directly
      c12: chronicleChoice ? `c12_${chronicleChoice}` : null,
    }[chKey] || null

    sections.push(
      <div key="decision">
        <SectionLabel>[ Decision ]</SectionLabel>
        <p className="text-stone-300 text-sm mb-4 font-serif italic">{prompt}</p>
        <div className="space-y-3">
          {choices.map(c => {
            const isActive = activeChoice && c.id.includes(activeChoice.split('_').pop())
            return (
              <div key={c.id} className={`rounded border px-4 py-3 ${isActive ? 'border-amber-700/60 bg-amber-950/20' : 'border-stone-800 bg-stone-900/40'}`}>
                <div className={`text-sm font-medium mb-1 ${isActive ? 'text-amber-400' : 'text-stone-300'}`}>{c.label}</div>
                {c.consequence && <p className="text-stone-400 text-xs leading-relaxed font-serif">{c.consequence}</p>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 7. Bridge scene (Ch.10, days 47–48)
  if (currentDay === 47 || currentDay === 48) {
    const bridgeKey = vialRecipient && dreamChoice ? `${vialRecipient}|${dreamChoice}` : null
    sections.push(
      <div key="bridge">
        <SectionLabel>[ The Forgetting — Bridge ]</SectionLabel>
        {bridgeKey && BRIDGE_SCENES[bridgeKey]
          ? <ProseBlock text={BRIDGE_SCENES[bridgeKey]} />
          : <p className="text-stone-500 text-sm font-serif italic">
              Select vial recipient (Ch.3) and dream (Ch.8) in the filters to reveal this scene.
            </p>
        }
      </div>
    )
  }

  // 8. Missed text (collapsible, always last)
  if (currentChapter?.missed) {
    sections.push(
      <details key="missed" className="group">
        <summary className="cursor-pointer list-none">
          <SectionLabel>
            <span className="group-open:text-stone-400 cursor-pointer hover:text-stone-300 transition-colors">
              [ What if Chip misses this day? ▸ ]
            </span>
          </SectionLabel>
        </summary>
        <div className="mt-2">
          <ProseBlock text={currentChapter.missed} />
        </div>
      </details>
    )
  }

  return (
    <div className="space-y-6">
      {sections.reduce((acc, section, i) => {
        if (i > 0) acc.push(<Divider key={`div-${i}`} />)
        acc.push(section)
        return acc
      }, [])}
    </div>
  )
}

// ── Password gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }) {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.ok) {
        sessionStorage.setItem('archive_auth', '1')
        onAuth()
      } else {
        setError('Incorrect password.')
      }
    } catch {
      setError('Server error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-amber-500 text-xl font-semibold mb-1 text-center" style={{ fontVariant: 'small-caps' }}>
          The Emberstone Chronicles
        </h1>
        <p className="text-stone-500 text-sm text-center mb-8">Archive access</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-stone-900 border border-stone-700 rounded px-4 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-600 text-sm"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-stone-100 rounded py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function QuestArchive({ mode = 'admin', token }) {
  // Auth state
  const [authed,      setAuthed]      = useState(
    mode === 'admin' ? sessionStorage.getItem('archive_auth') === '1' : false
  )
  const [tokenValid,  setTokenValid]  = useState(mode === 'public' ? null : true)
  const [tokenChecked, setTokenChecked] = useState(mode !== 'public')

  // Content state
  const [currentDay,      setCurrentDay]      = useState(1)
  const [selectedTier,    setSelectedTier]    = useState('good')
  const [vialRecipient,   setVialRecipient]   = useState(null)
  const [dreamChoice,     setDreamChoice]     = useState(null)
  const [natureObs,       setNatureObs]       = useState(null)
  const [halvardExit,     setHalvardExit]     = useState(null)
  const [emojiChoice,     setEmojiChoice]     = useState(null)
  const [chronicleChoice, setChronicleChoice] = useState(null)
  const [sidebarOpen,     setSidebarOpen]     = useState(false)

  const currentChapter = CAMPAIGN_1.chapters.find(
    c => currentDay >= c.days[0] && currentDay <= c.days[1]
  )

  const goToDay = useCallback((d) => {
    setCurrentDay(Math.max(1, Math.min(60, d)))
    setSidebarOpen(false)
  }, [])
  const goNext = useCallback(() => goToDay(currentDay + 1), [currentDay, goToDay])
  const goPrev = useCallback(() => goToDay(currentDay - 1), [currentDay, goToDay])

  // Token validation
  useEffect(() => {
    if (mode !== 'public' || !token) { setTokenChecked(true); return }
    fetch(`/api/archive/validate/${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => { setTokenValid(!!d.valid); setTokenChecked(true) })
      .catch(() => { setTokenValid(false); setTokenChecked(true) })
  }, [mode, token])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft')  goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  // Scroll main area to top on day change
  const mainRef = useRef(null)
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [currentDay])

  // Loading / token invalid states
  if (!tokenChecked) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-500 text-sm">Checking access…</div>
      </div>
    )
  }
  if (mode === 'public' && !tokenValid) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <p className="text-stone-400 text-sm font-serif italic">This chronicle is not yet complete.</p>
      </div>
    )
  }
  if (mode === 'admin' && !authed) {
    return <PasswordGate onAuth={() => setAuthed(true)} />
  }

  const showFilters = hasFilters(currentDay)

  const filterProps = {
    currentDay, currentChapter,
    selectedTier, setSelectedTier,
    vialRecipient, setVialRecipient,
    dreamChoice, setDreamChoice,
    natureObs, setNatureObs,
    halvardExit, setHalvardExit,
    emojiChoice, setEmojiChoice,
    chronicleChoice, setChronicleChoice,
    onGoToDay: goToDay,
  }

  const contentProps = {
    currentDay, currentChapter,
    selectedTier,
    vialRecipient, dreamChoice, natureObs, halvardExit, emojiChoice, chronicleChoice,
  }

  return (
    <div className="flex h-screen bg-stone-950 text-stone-100 overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <div className="hidden lg:block w-56 flex-shrink-0 bg-stone-900 border-r border-stone-800 overflow-y-auto">
        <ChapterList currentDay={currentDay} onSelectDay={goToDay} />
      </div>

      {/* ── Mobile chapter drawer ────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 bg-stone-900 border-r border-stone-800 overflow-y-auto z-10">
            <ChapterList currentDay={currentDay} onSelectDay={goToDay} />
          </div>
        </div>
      )}

      {/* ── Main content area ────────────────────────────────────────── */}
      <div ref={mainRef} className="flex-grow overflow-y-auto">

        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 bg-stone-950 z-10 flex items-center justify-between px-4 py-3 border-b border-stone-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-stone-400 hover:text-stone-200 text-xl w-8"
            aria-label="Open chapters"
          >
            ☰
          </button>
          <span className="text-stone-300 text-sm font-medium">Day {currentDay}</span>
          <div className="flex gap-2">
            <button onClick={goPrev} disabled={currentDay === 1} className="px-2 py-1 rounded bg-stone-800 text-stone-400 text-xs disabled:opacity-30">←</button>
            <button onClick={goNext} disabled={currentDay === 60} className="px-2 py-1 rounded bg-stone-800 text-stone-400 text-xs disabled:opacity-30">→</button>
          </div>
        </div>

        <div className="px-6 lg:px-8 max-w-3xl mx-auto">
          {/* Desktop nav top */}
          <div className="hidden lg:block">
            <NavBar currentDay={currentDay} onPrev={goPrev} onNext={goNext} position="top" />
          </div>

          {/* Chapter header */}
          {currentChapter && (
            <div className="mb-6 mt-4 lg:mt-0">
              <div className="flex items-baseline gap-3">
                <span className="text-amber-500/70 text-xs uppercase tracking-widest font-sans">
                  Chapter {currentChapter.number}
                </span>
                <span className="text-stone-500 text-xs">·</span>
                <span className="text-stone-400 text-sm">{currentChapter.title}</span>
                <span className="text-stone-600 text-xs ml-auto">📍 {currentChapter.location}</span>
              </div>
            </div>
          )}

          {/* Day content */}
          <DayContent {...contentProps} />

          {/* Mobile filters (below content) */}
          {showFilters && (
            <div className="lg:hidden">
              <FilterPanel {...filterProps} mobile={true} />
            </div>
          )}

          {/* Desktop nav bottom */}
          <div className="hidden lg:block">
            <NavBar currentDay={currentDay} onPrev={goPrev} onNext={goNext} position="bottom" />
          </div>

          {/* Mobile bottom nav */}
          <div className="lg:hidden sticky bottom-0 bg-stone-950 pt-4 pb-6 border-t border-stone-900 mt-8 flex items-center justify-between">
            <button onClick={goPrev} disabled={currentDay === 1} className="px-3 py-1.5 rounded bg-stone-800 text-stone-300 text-sm hover:bg-stone-700 disabled:opacity-30 transition-colors">← Prev</button>
            <span className="text-stone-500 text-xs">{currentDay} / 60</span>
            {currentDay === 60
              ? <span className="text-amber-500 text-xs">Chronicle Complete</span>
              : <button onClick={goNext} className="px-3 py-1.5 rounded bg-stone-800 text-stone-300 text-sm hover:bg-stone-700 transition-colors">Next →</button>
            }
          </div>
        </div>
      </div>

      {/* ── Desktop filter panel ─────────────────────────────────────── */}
      {showFilters && (
        <div className="hidden lg:block">
          <FilterPanel {...filterProps} />
        </div>
      )}
    </div>
  )
}
