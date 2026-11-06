# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Two packages, each with its own `npm i`: `frontend/` (Vite, port 3000) and `backend/` (Express, port 3001).

- Full stack: `docker-compose up --build` (backend + mongo:6 + frontend dev server). Needs the Docker daemon running.
- Frontend alone: `cd frontend && npm run dev`. Typecheck: `npx tsc`. Build: `npm run build`.
- Backend alone: `cd backend && npm start` (`node --import tsx server.js`; needs MongoDB at `MONGODB_URI`, default `mongodb://localhost:27017/kanban`).
- There is no test runner and no linter configured.

## Architecture

Kanban board with live sync. React + Redux Toolkit frontend (`frontend/src/`), Express + Socket.IO + Mongoose backend (`backend/`, ESM JavaScript importing TypeScript models via `tsx`). `backend/routes/cards.js` holds the REST routes; socket handlers are in `backend/server.js`. Routes return 503 while Mongo is disconnected, and socket handlers emit an `error` event to the sender instead. Mongo ids are exposed as string `id` (no `_id`) through the models' `toJSON` transform. The three default columns are seeded on first start.

**Server is the source of truth.** Clients send an intent (REST or socket), the server validates and writes to Mongo, then `io.emit`s the result to every client, including the sender. Exceptions: `typing` is relayed with `socket.broadcast` and never stored; card move is also applied optimistically on the sender (see below).

**Event flow.** Socket events (`cardMoved`, `cardUpdated`, `commentAdded`, `commentUpdated`, `commentDeleted`, `typing`) go client to server, and the server re-emits them with the same names. Card create/delete go through REST (`POST /cards`, `DELETE /cards/:id`) and are broadcast as `cardCreated`/`cardDeleted`. `GET /boards` returns the initial `{ columns, cards, comments }`.

**Frontend state.**
- `actions.ts` defines shared actions (one per server event, plus the `fetchBoard` thunk). `slices.ts` has the columns and comments slices (the cards slice is in `store/cardsSlice.ts`), which all react to these shared actions through `extraReducers`. For example, `cardMoved` updates both `cards[].columnId` and `columns[].cardIds`.
- `socket.ts` (`bindSocket`) turns every incoming socket event into one of those actions. It also refetches the board on reconnect, because events missed while offline are not replayed.
- Reducers must stay idempotent. The sender applies `cardMoved` optimistically and then receives the server's broadcast of the same event. Adding a reducer that appends or toggles without checking will double-apply.
- Column order is `columns[].cardIds`; `cards[].columnId` must stay consistent with it. Drops only target a column (cards are not droppable), so cards always append to the end and there is no reordering within a column.
- The `typing` indicator lives in the comments slice and expires after 2 seconds on a client-side timer.

**Server input rules.** `cardUpdated` whitelists `title` and `description` so clients cannot change `id` or `columnId` through it. Strings are trimmed and length-capped by the schemas in `backend/models/` and the `text()` helper in `backend/server.js`.

**Ports and hosts.** The API base URL is `http://${location.hostname}:3001` (`API` in `frontend/src/actions.ts`), so a phone on the LAN can use the dev server. CORS is open (`origin: '*'`).

## Claude Code permissions (`.claude/settings.json`)

- Allowed without prompting: `npm test`, any `git *` command, and `npm i *` (from `settings.local.json`). There is no `test` script yet, so `npm test` currently fails.
- Prompts first: `git commit *`.
- Denied: `git push *` (pushing is left to the user) and reading any `.env*` file.
- The deny rule also blocks writing `.env*` files. `.env.example` does not exist yet, though `README.md` step 1 (`cp .env.example .env`) expects it. `docker-compose.yml` falls back to a default `MONGODB_URI`, so the stack still starts without it. The file should contain `MONGODB_URI=mongodb://mongodb:27017/kanban` and `PORT=3001`; the user must create it.
