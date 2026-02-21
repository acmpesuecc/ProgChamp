import { db } from "../db/index";
import { NotFoundError, InvalidStateError } from "../lib/errors";
import { gameRequests, games, adminActions } from "../db/schema";
import { eq, and, count } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function getPendingGameRequest(id: string) {
    const request = await db.query.gameRequests.findFirst({
        where : eq (gameRequests.id, id)
    })

    if (!request) {
            throw new NotFoundError(`Game request not found `);
        }
    if (request.status !== "pending") {
            throw new InvalidStateError(`Invalid request status `);
        }
    
        return request

}

export async function approveGameRequest(id: string, adminId: string) {
  await db.transaction(async (tx) => {

    const request = await tx.query.gameRequests.findFirst({
      where: eq(gameRequests.id, id),
    });

    if (!request) {
      throw new NotFoundError("Game request not found");
    }

    if (request.status !== "pending") {
      throw new InvalidStateError("Invalid request status");
    }

    const gameId = `game_${nanoid(16)}`;

    await tx.insert(games).values({
      id: gameId,
      title: request.title,
      description: request.description,
      gameUrl: request.gameUrl,
      createdBy: request.submittedBy,
    });

    await tx.update(gameRequests)
      .set({
        id: gameId,
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      })
      .where(eq(gameRequests.id, id));

    await tx.insert(adminActions).values({
      id: `aa_${nanoid(16)}`,
      adminId: adminId,
      gameRequestId: id,
    });

  });
}

export async function validateGameSubmission(userId: string, body: any) {
  const title = body.title?.trim();
  const gameUrl = body.gameUrl?.trim();
  const description = body.description?.trim() ?? null;

  if (!title) throw new Error("Title is required");
  if (!gameUrl) throw new Error("Game URL is required");
  if (title.length > 100) throw new Error("Title too long");

  const existing = await db.query.gameRequests.findFirst({
  where: and(
    eq(gameRequests.submittedBy, userId),
    eq(gameRequests.gameUrl, gameUrl),
    eq(gameRequests.status, "pending")
    )
  });
  const existingGame = await db.query.games.findFirst({
  where: eq(games.gameUrl, gameUrl)
  });

  if(existingGame) throw new Error ("Game already exists");
  if(existing) throw new Error ("Game request already submitted")

  return { title, gameUrl, description };
}

export async function canUserSubmitNewGame(userId: string): Promise<boolean> {
  const [result] = await db
    .select({ value: count() })
    .from(gameRequests)
    .where(
      and(
        eq(gameRequests.submittedBy, userId),
        eq(gameRequests.requestType, "new_game"),
        eq(gameRequests.status, "pending")
      )
    );

  const pendingCount = result?.value ?? 0;
  return pendingCount < 3;
}
