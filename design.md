# Wait List Manager design

This application leverages the latest streaming SSR from React built on Bun + Hono.

Restaurant parameters such as seat capacity and service time are defined in
`src/lib/constants.ts` file which also specifies data message types for
WebSocket communication.

Upon party registration, form validation is performed both client- and
server-side then a JWT is issued to authenticate the original user.

This token can be used to manage the reservation and listen to server-side
updates via WebSockets.

Multiple browser sessions are supported by storing the JWT inside `localStorage`.

## Frontend

We serve a simplistic Material UI app with visual feedback for form validation,
error toast messages and a check out countdown that displays once the party is
seated.

The client-side code is bundled using [Vite](https://vite.dev).

SSR rendering/hydration and view navigation are built on [TanStack Router](https://tanstack.com/router)
which also provides rich TypeScript validation of app routes.

**Client routes:**

- `/` main user input form to fill in party details
- `/queue` display queue state and countdown once checked in

## Backend

Our Bun+Hono backend determines parties that should check out or become eligible
to check in at every database tick.

Data consistency is enforced using MongoDB transactions which require a replica set (appropriately configured in `docker-compose.yml`).

**Server routes:**

- `/api/queue` Party registration and JSON Web Token issuance
- `/api/ws` WebSocket endpoint for bidrectional communication

## Project Layout

React components are shared between client and server for SSR while server-only
code is kept from being included into the client bundle via a custom "user
server" directive.

```
src
├── client
│ └── hooks.ts # custom client hooks
├── client.tsx # client-side entrypoint
├── components # shared React components
├── index.tsx # server-side entrypoint
├── lib
│ └── constants.ts # all configuration
├── routes # TanStack Router route definitions
└── server # Backend APIs and database
```

## Testing

All client and server tests can be run using `bun test`.

### Unit Tests

User-facing React components are unit tested to ensure proper user input validation (eg. `src/components/queue_form.spec.ts`).

Backend database compliance with the specs outlined in the README is tested using a mocked MongoDB server running in memory (`src/server/database.spec.ts`).

Checked out parties are not removed from the database so as to be able to perform analytics later on.

### System Tests

In addition to the database tests an example data-seeding script `scripts/seed.ts` is provided to initialize the database with a fully occupied seat capacity.

Running this script using `bun run` saves time when performing manual testing of wait list features.

### End-to-End Tests

Writing e2e tests for concurrent browser sessions seems challenging but could be achieved using specific tools such as TableCheck's [wallaby](https://github.com/TableCheck-Labs/wallaby).

For this simple app, using a combination of new browser windows and private browsing windows is a reliable way of checking spec compliance across shared and independent client sessions.

## Possible Improvements

At present, parties that do not check in hold up the waitlist as they are given priority over other waiting customers.

Possible solutions to this loophole include timing out waiting parties or notifying multiple eligible parties if allowed by available seat count.
