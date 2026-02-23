import { db } from "./index";
import { users, games } from "./schema";

async function seed() {
    try {
        // Dummy user
        await db.insert(users).values({
            id: "user1",
            googleId: "dummy-google-id-user1",
            email: "user1@test.com",
            name: "Test User",
            avatarUrl: "https://example.com/avatar.png",
            userType: "normal",
            superlikesRemaining: 3,
            isActive: true,
        }).onConflictDoNothing();

        // Dummy game
        await db.insert(games).values({
            id: "game123",
            title: "Dummy Game",
            description: "Test game for reactions",
            gameUrl: "https://example.com/game",
            createdBy: "user1",
        }).onConflictDoNothing();

        console.log("Seed data inserted successfully");
    } catch (err) {
        console.error("Seed failed:", err);
    } finally {
        process.exit(0);
    }
}

seed();
