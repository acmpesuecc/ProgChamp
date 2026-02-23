Archita Agrawal - Week 1 report:

Topic: Backend – Game Reactions (Like / Dislike)

For Week-1, I worked on the backend for game reactions so that an authenticated user can toggle between like and dislike (add, modify or remove a reaction). I also ensured that this data is reflected in the database and worked consistently with the existing backend architecture.

Files Worked On:
`backend/src/routes/reactions.ts` (created)
`backend/src/index.ts` (modified)
`backend/src/db/seed.ts` (local testing only, not committed)
Minor references to `backend/src/db/schema.ts` and `backend/src/lib/middleware.ts`

Implemented two authenticated endpoints:

1. POST /reactions/:gameId/react
> Allows a user to like or dislike a game (add, remove, or change reaction type)

2. GET /reactions/:gameId/reaction
> Fetches the current user’s reaction for a given game ("like", "dislike", or null)

Authentication & Validation:
> Used the existing requireSession middleware so that user is authenticated and exists in the database.
> Implemented Zod schema validation for request bodies (as per GitHub Copilot's suggestion to refer to existing files like profile.ts):

`const reactionSchema = z.object({`
  `type: z.enum(["like", "dislike"]),`
`});`
(so that any reaction types except for the enumerated ones will be rejected.)

Foreign Key Safety:
> Explicit verification that the target game exists before inserting a reaction(to prevents foreign key constraint violations and orphaned reactions)

Integrated updates to the followeing counters from `game_reactions`:
> `games.countLikes`
> `games.countDislikes`

Wrapped reaction logic inside a database transaction to prevent race conditions (multiple users reacting simultaneously) and partial updates.

`await db.transaction(async (tx) => {`
  `// insert / delete / update reaction`
  `// atomically update counters`
`});`

Routing in `src/index.ts`:
`app.route("/reactions", reactions);`

Testing & Verification:
Learnt how to manually test endpoints using curl on Windows CMD
Used a temporary seed.ts file to insert test users and games (excluded from Git commits)

Learnt how to rebase Git commits and solve merge conflict.