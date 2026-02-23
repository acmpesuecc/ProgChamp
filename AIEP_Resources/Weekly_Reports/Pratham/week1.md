#Week 1 report-Pratham
--
##Setting Up the Project Locally
To get started this week, I focused on getting the entire project environment running on my own machine. 
I began by cloning the repository and using Bun to handle all the background dependencies, which kept the process fast and efficient. 
The trickiest part was getting the database to talk to my local code, as I had to deal with some network and DNS hurdles while installing the Turso CLI. 
Once I fixed that by manually setting up my environment variables and database tokens in a hidden .env file, I used Drizzle to "push" our planned data structure directly into the cloud. 
By the end of this setup, I had a fully functional link between my VS Code editor and our live Turso database, allowing me to see changes in real-time.
##Developing the Tags Logic
Once the system was live, I moved on to building the actual "Tags" feature, which is how we’ll categorize games on the platform. 
I wrote a specialized script called tags.ts that acts as a gatekeeper for all game categories. 
I made sure to include a "duplicate check" so that if someone tries to add a tag like "Action" when it already exists, the system politely declines instead of making a mess of our data. 
I also built a smart filtering tool that uses a "join table" to link games and tags together. 
This means that when a user clicks on a category like "RPG," the backend quickly looks at those links and pulls up every matching game in one go, making the discovery process smooth and fast for the players.
