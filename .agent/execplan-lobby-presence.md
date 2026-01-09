# ExecPlan: Lobby presence without guesses

This ExecPlan is a living document. The sections "Progress",
"Surprises & Discoveries", "Decision Log", and "Outcomes & Retrospective" must
be kept up to date as work proceeds.

This plan follows the guidance in `.agent/PLANS.md` and must be maintained in
accordance with it.

## Purpose / Big Picture

Players should appear as soon as they enter a room, even if they never submit a
guess. After this change, opening two tabs in the same room shows both players
in the sidebar immediately. Closing a tab or leaving the room removes that
player from the list and can trigger a toast.

## Progress

- [x] (2026-01-09 23:45Z) Wire Supabase Realtime Presence into
  `frontend/src/hooks/useRoomRealtime.ts` with track/untrack and join/leave
  events.
- [x] (2026-01-09 23:45Z) Add presence state in `frontend/src/hooks/useRoom.ts`
  and merge it into the player list before rendering.
- [x] (2026-01-09 23:45Z) Update `frontend/src/hooks/usePlayers.ts` and
  `frontend/src/components/screens/GameScreen/GameScreen.tsx` to show
  presence-only players and toasts on join/leave.
- [ ] (2026-01-09 23:45Z) Validate the behavior with two tabs and document
  expected results.

## Surprises & Discoveries

None yet. Update this section if Supabase Presence behaves differently than
expected or if the channel life cycle requires extra handling.

## Decision Log

- Decision: Use Supabase Realtime Presence on the existing `room:${roomId}`
  channel instead of new tables or RPC calls. Rationale: Presence is built for
  ephemeral join/leave signals and avoids schema changes. Date/Author:
  2026-01-09 / Codex.

## Outcomes & Retrospective

Not started. Summarize outcomes once the feature is implemented and verified.

## Context and Orientation

The frontend already subscribes to Supabase Realtime in
`frontend/src/hooks/useRoomRealtime.ts` for `rooms` and `guesses` changes. It
has a basic presence "sync" handler but does not wire it into the app state.
Players are currently derived only from guesses in
`frontend/src/hooks/usePlayers.ts`, which means a player is invisible until they
submit a guess. The player identity comes from local storage in
`frontend/src/hooks/usePlayer.ts` (`playerId`, `playerName`). The current
sidebar list is rendered in
`frontend/src/components/screens/GameScreen/PlayerSidebar.tsx`.

Supabase Realtime Presence lets clients announce "I am here" on a channel. It
uses a per-client "presence key" and a tracked payload, then provides join,
leave, and full-sync events for that channel.

## Plan of Work

First, update `frontend/src/hooks/useRoomRealtime.ts` to accept the current
player identity and to configure the channel with Presence. Set the presence
key to `playerId` so each browser tab is tracked as a unique player. After the
channel reports `SUBSCRIBED`, call `track` with `{ id, name, joinedAt }`. Add
handlers for `presence` events: `sync` should emit the full list, `join` should
emit the new players, and `leave` should emit the departed players. Ensure
cleanup calls `untrack` and `unsubscribe`.

Next, add presence state in `frontend/src/hooks/useRoom.ts`. Store a list of
present players derived from the presence callbacks. When leaving a room, clear
the presence list. Pass the list to `usePlayers` so it can merge presence-only
players with guess-based players.

Then update `frontend/src/hooks/usePlayers.ts` to accept an optional list of
present players and to merge them with the existing guess-derived map (dedupe
by `playerId`). Keep the existing score and guess count behavior for players
who have guesses; presence-only players should show `0` score and `0` attempts.

Finally, update `frontend/src/components/screens/GameScreen/PlayerSidebar.tsx`
to continue rendering the merged list. Reuse existing toast behavior in
`usePlayers` (or add a similar effect) to show join/leave notifications based
on presence events, not just guesses.

## Concrete Steps

1) Edit `frontend/src/hooks/useRoomRealtime.ts` to:
   - Accept `playerId` and `playerName` as inputs.
   - Configure `supabase.channel` with `presence: { key: playerId }`.
   - On `SUBSCRIBED`, call `roomChannel.track({ id: playerId, name: playerName,
     joinedAt: new Date().toISOString() })` if `playerName` is not empty.
   - Wire `presence` events (`sync`, `join`, `leave`) to callbacks so the caller
     can update state.
2) Edit `frontend/src/hooks/useRoom.ts` to:
   - Add state like `presentPlayers: PlayerData[]`.
   - Pass `playerId` and `playerName` into `useRoomRealtime`.
   - Update the presence list on sync/join/leave.
3) Edit `frontend/src/hooks/usePlayers.ts` to:
   - Accept `presentPlayers?: PlayerData[]`.
   - Merge `presentPlayers` into the `playerMap` before sorting.
4) Edit `frontend/src/components/screens/GameScreen/GameScreen.tsx` to:
   - Pass `presentPlayers` into `usePlayers`.
5) Run a manual check:
   - From repo root, run `docker-compose -f docker-compose.dev.yml up --build`.
   - Open `http://localhost:3001` in two tabs.
   - Create or join the same room in both tabs.
   - Confirm both players appear immediately, even with zero guesses.
   - Close one tab or click leave and confirm the player disappears and a toast
     appears (if enabled).

## Validation and Acceptance

The feature is accepted when:

- Joining a room causes the player to appear in the sidebar before any guesses.
- Closing a tab or leaving the room removes the player from the sidebar within
  a few seconds.
- No duplicate players appear for the same `playerId`.
- Existing guess sorting and scoring still work.

## Idempotence and Recovery

Presence is ephemeral and safe to re-run. If a player gets stuck as "online",
refresh the page or clear local storage to generate a new `playerId`. If the
presence handling fails, the app should still work with guess-only players.

## Artifacts and Notes

No artifacts yet. Add short transcripts or screenshots once validation is done.

## Interfaces and Dependencies

- Supabase JS Realtime Presence via `@supabase/supabase-js` (already in
  `frontend/package.json`).
- `frontend/src/hooks/useRoomRealtime.ts` should accept:
  - `playerId: string`
  - `playerName: string`
  - `onPresenceSync?: (players: PlayerData[]) => void`
  - `onPresenceJoin?: (players: PlayerData[]) => void`
  - `onPresenceLeave?: (players: PlayerData[]) => void`
- `frontend/src/hooks/usePlayers.ts` should accept `presentPlayers?: PlayerData[]`
  and return the same `PlayerSummary[]` as today.

Plan change log: updated progress after implementing presence wiring, state
merging, and UI updates; validation still pending.
