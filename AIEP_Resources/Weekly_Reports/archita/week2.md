This week we focused on completing the frontend and starting the integration of the backend with the frontend.

I worked on the UI for the "upload games" page, "all games" page and "my games" page using: SvelteKit with Svelte 5 runes, TypeScript, and CSS.

All three pages share a consistent cyberpunk aesthetic built from scratch including:
> CSS variables for a neon colour palette
> Neon text-shadow and box-shadow glows on interactive elements
> Custom animated cursor which scales and changes colour on hover
> Shared nav bar with logo, page links, active state highlighting, and a login/logout button
> Login modal with animated entrance
> Footer with four columns and a pulsing status indicator


`Upload Page (src/routes/upload/+page.svelte)`
> Contains form fields for game title, genre dropdown, description, URL input with "https://" prefix
> Drag-and-drop thumbnail dropzone with image preview, and a "change image" option on hover
> On submit, writes to the submissions store with status "pending"
> Auth-gated (prompts login modal if user is not logged in)

`All Games Page (src/routes/games/+page.svelte)`
> Displays all published games on the site
> Search bar filtering by title or developer name
> Genre filter pill buttons (12 genres)
> Sort dropdown (newest first, top rated, most played)
> Each game card has a 16:9 thumbnail (or a generated placeholder with a neon icon), genre label, title, dev credit, star rating, and player count
> "PLAY NOW" overlay appears on card hover
> Empty state shown when no results match the current filters
> Live result count updates as filters change


`My Games Page (src/routes/my-games/+page.svelte)`
> Auth-gated (shows "ACCESS DENIED" state if not logged in, prompting the login modal)
> Filters the submissions store to only show games belonging to the current user
> Three colour-coded sections:
    Yellow / pending — "Under Review", games that are awaiting admin approval
    Cyan / approved — "Live Games", with a link to view the game in the vault
    Pink / rejected — "Rejected Submissions", shows the rejectionReason from the store and a resubmit button linking back to the upload page

Summary of changes:
- modified `frontend/src/lib/stores/submissions.ts` to add 'genre' and 'rejectionReason' fields
- created `frontend/src/routes/all-games/+page.svelte` page
- modified `frontend/src/routes/upload/+page.svelte` page
- modified `frontend/src/routes/my-games/+page.svelte` page