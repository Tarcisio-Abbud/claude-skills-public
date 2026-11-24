import { expect, test } from 'claude-code/testing'
import { barCells, kiloTokens, levelOf, resetCountdown } from '../hooks/register'

const BAND = {
  plugin: 'desktop-statusline',
  component: 'AbovePrompt',
  // Only the props the hook reads; the cast spares the scroll/view plumbing.
  props: { hasSurvey: false, isWorking: false, maxRows: 10 } as never,
} as const

test('desktop draws context and limits; terminal keeps its own status line', async ($, on) => {
  on('session.usage', () => ({ value: {
    startedAt: 0,
    context: { tokens: 84_000, window: 200_000, percent: 42 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 89.6, resetsAt: '2099-01-01T00:00:00Z' }],
  } }))
  on('clock.now', () => ({ value: Date.parse('2098-12-31T22:00:00Z') }))
  on('clock.every', () => ({ value: undefined as never }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/home/user/project', source: 'startup' } as never)

  const desk = await $.ui.mount({ ...BAND, surface: 'desktop' })
  for (const text of [/^ 42%$/, /84k\/200k/, /^projects$/, /^5h $/, /^ 89%$/, /2h00m/]) {
    expect(await desk.find({ type: 'Text', text })).toBeDefined()
  }
  await desk.unmount()

  const term = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await term.find({ type: 'Text', text: /42%/ })).toBeUndefined()
  expect(await term.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await term.unmount()
})

test('levels, bar and countdown follow the server statusline script', async () => {
  expect(levelOf(69)).toBe('green')
  expect(levelOf(70)).toBe('yellow')
  expect(levelOf(89)).toBe('yellow')
  expect(levelOf(90)).toBe('red')
  expect(barCells(0)).toEqual({ filled: '', empty: '░'.repeat(10) })
  expect(barCells(100).filled).toBe('▓'.repeat(10))
  expect(kiloTokens(undefined)).toBe('?')
  expect(kiloTokens(999)).toBe('999')
  expect(kiloTokens(124_900)).toBe('124k')
  const now = Date.parse('2026-10-06T00:00:00Z')
  expect(resetCountdown('2026-10-08T12:00:00Z', now)).toBe('2d')
  expect(resetCountdown('2026-10-06T04:05:00Z', now)).toBe('4h05m')
  expect(resetCountdown('2026-10-05T00:00:00Z', now)).toBe('0h00m')
  expect(resetCountdown(undefined, now)).toBe('')
})
