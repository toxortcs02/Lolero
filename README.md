# Lolero

A single-player esports career simulator inspired by League of Legends' Korean competitive scene (LCK). You create a player, pick a role and a playstyle, and live out a career season by season — tryouts, transfer offers, playoffs, international tournaments, salary negotiations, retirement — all told through a decision-driven narrative layer on top of a lightweight stat simulation.

Built as a full-stack Next.js app with a Supabase backend and a from-scratch admin dashboard for managing game content without touching code.

> 🎮 [Play](https://lolero.vercel.app/)

---

## What it does

- **Character creation** — pick a role (Top/Jungle/Mid/ADC/Support) and one of three per-role "playstyles" (e.g. a Mid can go Mage, Assassin or Roamer), each nudging your starting attributes in a different direction.
- **A career, not a match** — the game runs in yearly cycles: a regular-season split, transfer windows, tournament checkpoints (First Stand, MSI, Worlds), and a playoff run, all resolved through narrative decision events rather than a play-by-play match engine.
- **A real transfer market** — your very first contract is a market moment, not a coin flip: an average rookie gets 4–6 offers from Challengers clubs after tryouts; the rare exceptional prospect (a ~5% roll) gets fought over by top-flight LCK clubs instead. Every later transfer window works the same way — real club names, real-feeling offers, salary and squad-role previews before you sign.
- **Two competitive tiers** — a Challengers (development) league every career starts in, and the LCK (top flight) you get promoted to through performance, academy call-ups, or being scouted straight out of the gate.
- **A economy that reacts to your career** — salaries scale with team strength, league tier, age (rookies and players nearing 30 earn less than a player in their prime, though a young prodigy is cushioned from the full rookie penalty), fan following, and whether you're an established name or a club taking a chance on you. Winning a title roughly doubles your market value.
- **Stats that reflect how the season actually went** — KDA isn't independently rolled per game; it's derived from the season's win/loss margin (a 16–2 split reads very differently from a 9–9 one) and from how the playoff run went, with a "carry" adjustment so a standout player doesn't get dragged down by a bad team.
- **Big-moment decisions** — qualifying for a tournament or playoffs triggers a role-specific decision resolved by a skill-weighted personal roll OR'd with the underlying team result, so a strong individual play can rescue a bad team outcome.
- **A content admin dashboard** — search, create, edit and delete decision events and team data (crests, kits, colors, strength ratings) from a protected `/admin` panel backed by Supabase, no redeploys required.
- **A public leaderboard** — completed careers are scored and ranked, so different runs are comparable.

---

## Tech stack

| Layer             | Choice                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Framework         | [Next.js 16](https://nextjs.org/) (App Router, Turbopack)                                        |
| Language          | TypeScript                                                                                       |
| UI                | React 19, [Tailwind CSS v4](https://tailwindcss.com/), a custom "Hextech" design system          |
| Animation         | [Framer Motion](https://www.framer.com/motion/)                                                  |
| Client state      | [Zustand](https://github.com/pmndrs/zustand) — a single career store drives the entire game loop |
| Backend           | [Supabase](https://supabase.com/) (Postgres, Row Level Security, Storage for team assets)        |
| Auth              | Cookie-based admin session (HMAC-style hashed token, no plaintext password stored client-side)   |
| Deployment target | Vercel                                                                                           |

---

## Project structure

```
src/
├── app/
│   ├── crear/          # character creation
│   ├── carrera/         # the game hub — the whole career loop lives here
│   │   ├── partido/     # "big moment" decision resolution screen
│   │   └── pretemporada/
│   ├── retiro/          # career-end recap
│   ├── ranking/          # public leaderboard
│   ├── admin/            # events & teams CMS (auth-gated)
│   └── api/               # REST-ish route handlers (careers, leaderboard, admin CRUD)
├── store/
│   └── careerStore.ts    # Zustand store — the entire game state machine
├── content/                # typed, mostly-static game content & simulation logic
│   ├── teams.ts, contracts.ts, matchSim.ts, playoffs.ts
│   ├── events.ts, transferEvents.ts, bigMoments.ts, gameStyles.ts
│   └── attributes.ts, roles.ts, ...
├── lib/                    # Supabase clients, admin auth
└── types/                  # shared domain types
supabase/
└── migrations/             # versioned SQL schema + RLS policies
```

---

## Development process

This project was designed and built end-to-end by me — the game design (attribute system, career pacing, transfer market rules, economy balancing, narrative event structure), the data model, the Supabase schema and RLS strategy, and the admin tooling are all product and architecture decisions I made and iterated on.

For the repetitive, mechanical parts of the build — scaffolding CRUD boilerplate, generating bulk content (team rosters, flavor text variants), writing throwaway verification scripts, and first-draft implementations of well-specified features — I worked alongside an AI coding assistant to move faster, the way most modern engineering teams do today. Every change went through manual review, real browser testing, and TypeScript's compiler before landing; the design calls (what the economy formula should reward, how KDA should read, how the transfer market should feel) were mine.

---

## Roadmap

- Rival system between careers
- Favorite champion selection
- A persistent bottom stats bar (savings, rival comparison, live stat deltas)

# Technical Overview

This document explains how Lolero is built: the architecture, the core game-state design, the simulation systems, and the engineering decisions behind them. It's written for anyone technical evaluating the project — a recruiter's engineer, a curious contributor, or future me.

## Contents

- [Architecture](#architecture)
- [The career state machine](#the-career-state-machine)
- [Content model: materialized events](#content-model-materialized-events)
- [The transfer market](#the-transfer-market)
- [The economy](#the-economy)
- [Match simulation & KDA](#match-simulation--kda)
- [Big-moment decisions](#big-moment-decisions)
- [Data layer & security](#data-layer--security)
- [Admin dashboard](#admin-dashboard)
- [Design system](#design-system)
- [Verification workflow](#verification-workflow)

---

## Architecture

Lolero is a Next.js 16 App Router application. There's no separate backend service — Supabase (Postgres + Storage) is the persistence layer, accessed two ways:

- **Read-only, client-side, anon key** — teams and events are public game data, readable directly from the browser under RLS policies that only allow `SELECT`.
- **Writes, server-side, service-role key** — the admin dashboard's CRUD operations go through Next.js route handlers (`src/app/api/admin/**`) that use the Supabase service-role key, which bypasses RLS. The service key never reaches the client; every write is gated behind a cookie-based admin session checked on the server.

This split means the anon key can be fully public (it can only ever read) while all mutation is centralized behind an authenticated boundary — a small amount of infrastructure that keeps the trust model simple.

The game itself is a client-heavy single-page experience once loaded: almost all game logic runs in the browser against a Zustand store, with Supabase calls only at the edges (loading team/event content, submitting a finished career to the leaderboard, admin writes).

## The career state machine

`src/store/careerStore.ts` is the heart of the app — a single Zustand store that models an entire playthrough as a state machine. Its central loop is `advance()`, which walks a per-season "year plan" (an ordered list of slots: transfers, regular season, tournament checkpoints, more transfers) and, for each slot, decides what the player sees next:

- a **materialized event** (narrative decision, e.g. a transfer offer or a locker-room conflict),
- a **match/split simulation** (competitive or international slots),
- a **big-moment decision** (tournament/playoff qualification),
- or a **year-end recap**, before rolling into the next season.

Every transition is explicit and derived from state that already exists (season, slot index, league, standing position, whether playoffs were reached) rather than duplicated flags — the loop re-derives what should happen next each time instead of trusting cached "what happens next" data, which avoids a class of bugs where the UI and the state machine disagree about where the player is.

One deliberate piece of state-machine care: **React 18/19 Strict Mode double-invokes effects in development**, which means an effect-triggered `advance()` can fire twice back-to-back. If `advance()` blindly used the store's live state on both calls, the second call would silently skip an event. The store resolves this by calling `advance()` synchronously inside `startCareer()` instead of leaving the very first advance to a page-level effect — removing the race entirely rather than patching around it with idempotency flags.

## Content model: materialized events

Most decision events in Lolero are static, hand-authored content (`src/content/events.ts`) — flavor text and choices that don't depend on runtime state. But transfer-market events _do_ depend on runtime state: which teams exist, how strong they are, which one you currently play for. Modeling those as static content would mean either duplicating an event per team (unmaintainable) or baking team lookups into the UI layer (leaky).

Instead, `transferEvents.ts` exports **builder functions** — `buildDebutEvent`, `buildTier1OffersEvent`, `buildLeagueChampionOffersEvent`, etc. — that take the live team pool and the player's current team and return a `MaterializedEvent`: a fully-formed event object with real club names baked into the title, description, and each choice's `label`/`resolution` text. The type distinguishes two concerns that look similar but aren't:

- `targetTeamId` — signing this choice **actually reassigns** the player to that club.
- `displayTeamId` — this choice **should render as an offer card** (crest, projected salary, squad-role indicator) even if it doesn't move the player (e.g. a "reject and stay" option still gets flavor treatment).

Separating those two fields let the offer-card UI (`OfferCard` in `carrera/page.tsx`) stay a dumb renderer — it doesn't need to know _why_ a choice has a team attached, only whether to draw a card for it.

## The transfer market

The career-debut event is the clearest example of the materialized-event pattern doing real work. Instead of a flavor-only "accept humbly / accept confidently" choice, `buildDebutEvent` looks at whether the player rolled into the LCK directly (a rare ~5% "prodigy" start) or the normal Challengers path, and builds a genuinely different market:

- **Average player** — the club that ran your tryouts is a guaranteed offer, plus 3–5 more Challengers clubs pulled at random (`shuffle()`, Fisher–Yates) — 4 to 6 offers total, each with its own projected salary and "will you start or fight for the spot" read based on relative team strength.
- **Exceptional player** — two of the strongest LCK clubs are guaranteed to be bidding, plus a 50/50 chance of one or two more — 3 or 4 offers, framed narratively as the rare event it's meant to be.

Every later transfer window (rival offers, four-way bidding wars, contract-end renewals, league-champion offer floods, academy call-ups) reuses the same builder pattern, so the "real transfer market" feel is consistent throughout the career, not just at the start.

## The economy

Salaries (`src/content/contracts.ts`) are intentionally a small rules engine rather than a single formula tweak, because the brief was specific about what should move the number:

- **Academy/youth rosters pay nothing** — a hard override, not a discount.
- **Age curve** — nine sampled points across the game's actual age range (17–30) shaped like a bell curve (`0.5 → 1.5 → 0.5`), so pay peaks mid-career. A young player who's clearly outperforming their age (high overall relative to a 60-point threshold) has that rookie penalty softened, but not erased — "promising rookie" and "proven veteran" are different things and the numbers should say so.
- **"Opportunity" vs. "proven"** — a big club signing an unproven player pays below its own market rate; the discount shrinks as the player's prestige catches up to the club's reputation. The same club, signing the same overall-skill player once they've actually proven themselves there, pays full rate.
- **Fan bonus** — a small, deliberately modest per-follower bump, extrapolated from a 0–100 loyalty stat rather than a real follower count (there isn't one — this is flavor, not a second economy).
- **Championship bump** — winning a title roughly doubles the market-rate multiplier for the next contract.

Every one of these rules was verified numerically before shipping — not just "it compiles" — using scenario tables run through a temporary debug API route (see [Verification workflow](#verification-workflow)) that printed side-by-side salaries for a rookie vs. a prodigy, an opportunity signing vs. a proven star, and a champion vs. a non-champion, to confirm the _direction and magnitude_ of each rule before deleting the scaffolding.

The pre-signing offer cards shown during transfer events call the exact same `rollContract()` function the real signing does — earlier in the project these were two separate systems (a flashy, unrealistic hash-based number for the card, and a much smaller number for the actual signed contract), which was a believability bug: what you saw before signing had nothing to do with what you actually got. Unifying them removed a whole class of "wait, that's not what I signed for" confusion for free.

## Match simulation & KDA

`src/content/matchSim.ts` intentionally does _not_ generate a stat line game-by-game in isolation. The two things it needs to respect — "a lopsided win/loss margin should read as a much better season than a middling one, even at similar win counts" and "an individually excellent player shouldn't have their stat line dragged down by a bad team" — are both about the _shape of the season_, not any single game, so the season's result is generated first and the stat line is derived from it:

1. Simulate all `REGULAR_SEASON_GAMES` (18) games' win/loss outcomes using the existing team-strength/overall-driven win probability.
2. Turn the resulting **margin** (not the raw win count) into a 0–100 season-performance score — a 16–2 season scores far higher than a 9–9 one even though both technically involve "some wins."
3. Apply a **carry adjustment**: if the player's skill (rescaled to the same 0–10 scale team strength already uses) exceeds their team's, the gap nudges their personal performance score up, independent of how the team's season actually went.
4. Generate each game's individual K/D/A around that personal performance score, still swinging a little per-game based on whether _that specific game_ was a win or a loss — so a loss inside a strong season still looks like a worse individual game than a win does, without the whole season's read collapsing to game-by-game noise.

Playoffs are folded in afterward with the same shape: `applyPlayoffAdjustment` nudges the already-simulated season's stat line by up to ±15% based on how far the playoff run went (an early exit reads slightly negative, a title run meaningfully positive), applied once at year-end rollover rather than re-running the whole season simulation.

This was, again, verified with real numbers before shipping: simulating hundreds of seasons across a strong/balanced/weak team-strength spread produced average KDAs of ~16.8 / ~7.7 / ~4.7 respectively — confirming the ordering the design called for — and a same-team-strength comparison between a high-overall and an average-overall player showed the high-overall player keeping a much better KDA (~16.1 vs ~6.9) _despite both having a losing record_, confirming the carry rule actually does what it's supposed to under a losing season, not just a winning one.

## Big-moment decisions

Tournament checkpoints and playoff qualification trigger a `PendingBigMoment` — a role-specific decision (`src/content/bigMoments.ts`) resolved on a dedicated screen (`/carrera/partido`) rather than folded into the regular event feed, because it's meant to feel like a distinct, higher-stakes beat.

The resolution rule is deliberately forgiving in one specific way: the event is **won if either** a personal, stat-weighted dice roll succeeds **or** the underlying team result (the match/playoff outcome, simulated independently) was already a win — it's only lost if both fail. Mechanically that's an OR over two independent rolls; narratively it means a strong individual play can save a bad team result, and a good team result doesn't get invalidated by one missed individual read. Losing requires both to go wrong at once, which keeps the mode feeling fair rather than punishing.

## Data layer & security

- **RLS-first**: every public table (`teams`, `events`) has RLS enabled with an explicit `SELECT`-only policy for anonymous access. There is no anon insert/update/delete policy anywhere — mutation is only possible through server routes using the service-role key, which is never exposed to the client.
- **Admin auth**: the admin cookie doesn't store the password — it stores `sha256(password + server-side secret)`, computed and checked entirely server-side. A leaked cookie is useless without also knowing the secret; a leaked secret alone (e.g. from an env dump) is useless without the password.
- **Migrations are additive and reviewed**: each `supabase/migrations/*.sql` file is a small, single-purpose change (add a column, add a table, add a policy) rather than one large schema file, which keeps history legible and each change independently reviewable.

## Admin dashboard

`/admin` (password-gated) lets non-technical edits happen without a deploy: searching, creating, editing, and deleting decision events; uploading real team crests/kits to Supabase Storage in place of the color-and-initials placeholder; adjusting team strength ratings that feed the standings, playoff, and win-probability simulations. It's a small CMS scoped tightly to what the game content actually needs, not a general-purpose admin framework — the events table's `choices` column is `jsonb`, so the shape can evolve (new event/effect fields) without a migration every time content design changes.

## Design system

The UI runs on Tailwind CSS v4 with a custom "Hextech" theme (gold/navy, glass-panel surfaces) expressed as a small set of reusable utility classes (`hx-panel`, `hx-choice`, `hx-badge`, `hx-offer-card`, `hx-stat`) rather than one-off styling per component, so new screens inherit a consistent look automatically. Framer Motion handles the transitions between event states, stat deltas, and offer-card reveals.

## Verification workflow

Without Playwright/Puppeteer available in this environment, real end-to-end checks were done with a small hand-rolled harness: spawn headless Chrome, drive it over the Chrome DevTools Protocol via a raw `WebSocket`, script character creation and decision-clicking through the actual running dev server, and assert on the real rendered DOM (offer-card counts, stat values, screenshot diffs) — not on unit-tested logic in isolation. For pure-function content logic (contract math, KDA math), short-lived debug API routes exercised the real functions with realistic inputs and printed comparison tables, which were deleted once the numbers checked out. Every feature in this document was confirmed against actual running output before being considered done, not just "the types check."
