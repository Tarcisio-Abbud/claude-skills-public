// register.tsx — the desktop-statusline mod: the server statusline's figures,
// drawn in the desktop Code tab.
//
// WHY IT EXISTS. The desktop app runs no `statusLine` command, so the context
// window and the 5h/weekly limits a terminal session shows at a glance are
// missing there. `$.session.usage()` and `session.measure` hand a mod the same
// figures the statusline script reads.
//
// WHERE IT DRAWS. The `AbovePrompt` band, on the desktop surface only: the
// terminal passes through and keeps its own status line. Below the input was
// tried and refused by the app (measured on 2.1.288): the desktop draws neither
// a `PromptHint` tree nor rewritten `SessionMode` labels. The band's frame and
// shadow are the app's chrome. Model and effort are left out because the app's
// footer already shows them.
//
// HOW IT FAILS. With no figure yet it passes the band on and draws nothing.
import { atom, read, update } from 'claude-code'
import type { Register, RenderChildren, SessionUsage, Timer } from 'claude-code'

import type { Limit, Snapshot } from '../types'

const snap = atom({ plugin: 'desktop-statusline', key: 'snap' } as const, { limits: [] } as Snapshot)
const tick = atom({ plugin: 'desktop-statusline', key: 'tick' } as const, 0)

const BAR_WIDTH = 10
const LIMIT_LABEL: Record<string, string> = { five_hour: '5h', seven_day: 'wk', spend_limit: '$' }

export type Level = 'green' | 'yellow' | 'red'

// The statusline script's thresholds, on the truncated percent it prints.
export const levelOf = (percent: number): Level => (percent >= 90 ? 'red' : percent >= 70 ? 'yellow' : 'green')

export const barCells = (percent: number) => {
  const filled = Math.min(BAR_WIDTH, Math.max(0, Math.round((percent * BAR_WIDTH) / 100)))
  return { filled: '▓'.repeat(filled), empty: '░'.repeat(BAR_WIDTH - filled) }
}

export const kiloTokens = (n?: number) => (n === undefined ? '?' : n >= 1000 ? `${Math.floor(n / 1000)}k` : `${n}`)

// Time left until a window resets: whole days past a day, as the script prints.
export const resetCountdown = (resetsAt: string | undefined, now: number) => {
  if (!resetsAt) return ''
  const s = Math.max(0, Math.floor((Date.parse(resetsAt) - now) / 1000))
  if (s >= 86400) return `${Math.floor(s / 86400)}d`
  return `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`
}

const fromUsage = (u: Pick<SessionUsage, 'context' | 'rateLimits'>): Partial<Snapshot> => ({
  ctxPercent: u.context.percent,
  ctxTokens: u.context.tokens,
  ctxWindow: u.context.window,
  limits: u.rateLimits.map((r): Limit => ({ kind: r.kind, percent: r.percentUsed, resetsAt: r.resetsAt })),
})

export const register: Register = on => {
  let countdownTimer: Timer | undefined

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const dir = result.cwd.split('/').filter(Boolean).pop() ?? result.cwd
    const usage = await $.session.usage()
    await update($, snap, s => ({ ...s, dir, ...fromUsage(usage) }))
    // Redraw once a minute so the reset countdowns stay current; one timer per load.
    countdownTimer?.cancel()
    countdownTimer = $.clock.every(60_000, () => void update($, tick, n => n + 1))
    return result
  })

  on('session.measure', async ($, e, next) => {
    await update($, snap, s => ({ ...s, ...fromUsage(e) }))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || e.props.hasSurvey) return next(e)

    const s = await read($, snap)
    await read($, tick)
    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    const meter = (label: string, rawPercent: number, detail: string) => {
      const percent = Math.floor(rawPercent)
      const color = levelOf(percent)
      const cells = barCells(percent)
      return [
        <Text>{label} </Text>,
        <Text color={color}>{cells.filled}</Text>,
        <Text dimColor>{cells.empty}</Text>,
        <Text color={color}> {percent}%</Text>,
        detail ? <Text dimColor> ({detail})</Text> : null,
      ]
    }

    const segments: RenderChildren[][] = []
    if (s.dir) segments.push([<Text bold>{s.dir}</Text>])
    if (s.ctxPercent !== undefined) {
      segments.push(meter('ctx', s.ctxPercent, `${kiloTokens(s.ctxTokens)}/${kiloTokens(s.ctxWindow)}`))
    }
    for (const l of s.limits) {
      segments.push(meter(LIMIT_LABEL[l.kind] ?? l.kind, l.percent, resetCountdown(l.resetsAt, now)))
    }
    if (!segments.length) return next(e)

    const row = segments.flatMap((seg, i) => (i ? [<Text dimColor> │ </Text>, ...seg] : seg))
    return (
      <Box flexDirection="row" flexWrap="wrap">
        {row}
      </Box>
    )
  })
}
