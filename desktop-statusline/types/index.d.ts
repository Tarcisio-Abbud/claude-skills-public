export type Limit = { kind: string; percent: number; resetsAt?: string }

export type Snapshot = {
  dir?: string
  ctxPercent?: number
  ctxTokens?: number
  ctxWindow?: number
  limits: Limit[]
}

declare module 'claude-code' {
  interface PluginState {
    'desktop-statusline': { snap: Snapshot; tick: number }
  }
}
