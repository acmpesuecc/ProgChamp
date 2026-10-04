This week I worked on setting up and designing the frontend for progchamp. We used Sveltekit for this as it helps with both fetching data from the server side and the rendering on the webpage. This made the prohect easier to manage

For the homepage we designed a cyberpunk-themed interface. This includes:
1)a navigation bar with a search field and login controls
2)an animated space invaders game for design purposes 
3)a trending games grid
4)a genre categories section
5)a custom animated cursor that smoothly follows the mouse and reacts when hovering over interactive elements. 
The entire design uses a dark colour palette with neon cyan, pink, yellow, and purple accents.
Frontend files I worked on:
•	src/routes/+page.svelte — designed and built the full homepage UI
•	src/routes/+page.server.ts — set up server-side data loading for the homepage
•	src/routes/+layout.server.ts — configured session data to flow to all pages
