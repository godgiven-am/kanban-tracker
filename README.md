# Kanban App

React + Redux Toolkit frontend, Express + Socket.IO backend, MongoDB storage.

## Setup

1. `cp .env.example .env`
2. `docker-compose up --build`
3. Open http://localhost:3000

The API listens on http://localhost:3001. MongoDB data persists in the `mongo_data` volume.

## Authentication and roles

Set in `.env` (see `docker-compose.yml`):

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Required, 32+ characters |
| `ADMIN_EMAIL` | The account with this email becomes `ADMIN` when it verifies its email |
| `SMTP_URL` | Optional, e.g. `smtps://user:pass@host`. Without it, verification links are printed to the backend log |
| `MAIL_FROM`, `APP_URL` | Sender address and frontend base URL used in the verification link |

Roles: `UNVERIFIED` can only view the board and edit their profile. `VERIFIED` can also create, move, edit and delete cards, and add comments (and edit or delete their own). `ADMIN` can also moderate: hide or restore comments, ban or unban users, and edit or delete any comment. Verification links expire after 24 hours.

Auth endpoints are `/auth/*`, profile is `PATCH /users/me`, and admin endpoints are `/users` and `/moderation/*`. Socket.IO connections must send the JWT as `auth.token`.
