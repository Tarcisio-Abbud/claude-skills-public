---
name: second-opinion
description: "A fresh subagent's verdict on the question the session is in, once or argued to consensus. Use only when the user asks for a second opinion."
argument-hint: "[consensus|once] [turns] [--prompt <file>]"
arguments: mode turns
disable-model-invocation: true
---

A **second opinion** is a verdict from a mind that did not do the work: it sees the question and
the evidence, not the hours behind the session's position. So the opinion comes from a **fresh**
subagent on `fable` (`opus` as fallback): a fork inherits this context and its blind spots.

Arguments: `$mode` is `consensus` (empty defaults to it) or `once`. `$turns` is the **turn
budget** for `consensus`: the number of subagent replies, the first opinion included; empty
defaults to 3. An unrecognised value takes its OWN default rather than stopping the skill —
`consensus` for `$mode`, 3 for `$turns` — and the report opens with one line naming what was
ignored. Both are POSITIONAL, so prose typed after the command lands in them — `--prompt <file>`
included, which step 1 consumes and that line never names.

**Fallback.** When a dispatch or a `SendMessage` fails because Fable is unavailable (HTTP 429,
quota, no access, unknown model), dispatch `second-opinion:second-opinion` with
`model: "opus"`, once per run. Mid-argument, its prompt is step 1's plus the thread so far and
the unsent message, and its name replaces the old one. Report any other failure, or a failed
fallback, and stop.

## Steps

1. **Write the prompt** for a **cold reader**: the question in one sentence; the user's own words,
   verbatim; the options; the evidence, as paths and quoted lines the subagent can open; the
   session's position and its reasoning, last. The subagent discounts a claim without a path or
   quote. Then the ask: "form your own verdict from the evidence before reading the session's
   position, then attack it", and the reply shape — `AGREE` or `DISAGREE`, the disputed points each
   with the evidence it rests on, then what the session should change. With `--prompt <file>`, that
   file is the prompt, and a typed `$mode` wins. Its mode is the first word after the first `Mode:`
   — `once` or `consensus` — and the rest of that line is prompt. Done when someone with no session
   context could answer the question from the prompt alone.

2. **Dispatch** `Agent` with `subagent_type: "second-opinion:second-opinion"`. Its definition
   pins `model: fable` and `effort: high`, whatever this session's effort is. In `consensus`,
   record the agent name the result returns: `SendMessage` continues it. Done when the reply is
   in hand — turn 1.

3. **Argue** (`consensus` only). Before each send, compare replies received with `$turns`; equal
   means the budget is spent, stop. Otherwise reply through `SendMessage` with one move per
   disputed point — **concede** it, saying what changes, or **hold** it with the evidence the
   subagent missed — and ask for the same two moves. A point neither side can move with new
   evidence is **deadlocked**: go on. **Consensus** is an empty list of disputed points. Done at
   every point agreed or deadlocked, or at the spent budget.

4. **Report** to the user, outcome first, in the user's language:
   - `once`: the verdict, the points, what changes in the session's position.
   - consensus reached: the agreed position, the turns it took, what the session conceded.
   - budget spent or deadlocked: the open points, each with both sides' evidence — the human
     settles a split.

   Close with one line naming the model that answered: `second-opinion: fable` or
   `second-opinion: opus — fable unavailable (<error>)`.
   Done when the user has the outcome and the line.
