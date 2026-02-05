# Frontend
## Project Structure
```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── ui/
│   │   │   │       ├── Button.svelte
│   │   │   │       ├── Card.svelte
│   │   │   ├── Footer.svelte
│   │   │   ├── Header.svelte
│   │   └── GameCard.svelte
│   │   ├── data/
│   │   │   └── games.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── stores/
│   │   │   ├── ratings.ts
│   │   │   ├── submissions.ts
│   │   │   └── user.js
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── index.ts
│   │
│   ├── routes/
│   │    ├── admin/
│   │    │   ├── +page.svelte
│   │    │   └── +page.ts
│   │    ├── game/
│   │    │   └── [id]/
│   │    │       ├── +page.svelte
│   │    │       └── +page.ts
│   │    ├── my-games/
│   │    │   └── +page.svelte
│   │    ├── upload/
│   │    │   ├── +page.svelte
│   │    │   └── +page.ts
│   │    ├── +layout.server.ts
│   │    ├── +layout.svelte
│   │    └── +page.svelte
│   │
│   ├── app.css
│   ├── app.d.ts
│   ├── app.html
│   ├── auth.ts
│   └── hooks.server.ts
│
├── static/
│   ├── games/
│   └── favicon.svg
│
├── .gitignore
├── .npmrc
├── LICENSE
├── README.md
├── package.json
├── package-lock.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```
