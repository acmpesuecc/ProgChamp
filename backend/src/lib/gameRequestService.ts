import { db } from "../db/index";
import { NotFoundError, InvalidStateError } from "../lib/errors";
import {
  gameRequests,
  games,
  adminActions,
  userRequests,
  gameMedia,
  gameTags,
  gameRequestTags,
} from "../db/schema";
import { eq, and, count } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function getPendingGameRequest(id: string) {
  const request = await db.query.gameRequests.findFirst({
    where: eq(gameRequests.id, id),
  });

  if (!request) {
    throw new NotFoundError("Game request not found");
  }
  if (request.status !== "pending") {
    throw new InvalidStateError("Invalid request status");
  }

  return request;
}

export async function approveGameRequest(id: string, adminId: string) {
  await db.transaction(async (tx) => {
    // Load the request with its media and tags in one round-trip
    const request = await tx.query.gameRequests.findFirst({
      where: eq(gameRequests.id, id),
      with: {
        media: true,
        tags: true,
      },
    });

    if (!request) {
      throw new NotFoundError("Game request not found");
    }

    if (request.status !== "pending") {
      throw new InvalidStateError("Invalid request status");
    }

    const gameId = `game_${nanoid(16)}`;

    // Create the game — coverMediaId starts null, set below after media copy
    await tx.insert(games).values({
      id: gameId,
      title: request.title,
      description: request.description,
      gameUrl: request.gameUrl,
      createdBy: request.submittedBy,
      coverMediaId: null,
    });

    // Point all media rows at the new game
    if (request.media.length > 0) {
      for (const media of request.media) {
        await tx
          .update(gameMedia)
          .set({ gameId })
          .where(eq(gameMedia.id, media.id));
      }

      // Resolve coverMediaId: prefer the row flagged isCover, else first media
      const coverRow = request.media.find((m) => m.isCover) ?? request.media[0];
      if (coverRow) {
        await tx
          .update(games)
          .set({ coverMediaId: coverRow.id })
          .where(eq(games.id, gameId));

        // Keep the request's coverMediaId in sync too
        await tx
          .update(gameRequests)
          .set({ coverMediaId: coverRow.id })
          .where(eq(gameRequests.id, id));
      }
    }

    // Copy staged tags from gameRequestTags → gameTags
    if (request.tags.length > 0) {
      await tx.insert(gameTags).values(
        request.tags.map((rt) => ({
          gameId,
          tagId: rt.tagId,
        })),
      );
    }

    // Mark request as approved
    await tx
      .update(gameRequests)
      .set({
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      })
      .where(eq(gameRequests.id, id));

    // Write audit log
    await tx.insert(adminActions).values({
      id: `aa_${nanoid(16)}`,
      adminId,
      actionType: "approve_game",
      decision: "approved",
      gameRequestId: id,
      targetGameId: gameId,
    });
  });
}

export async function canUserSubmitRequest(userId: string): Promise<boolean> {
  const [[gameResult], [userResult]] = await Promise.all([
    db
      .select({ value: count() })
      .from(gameRequests)
      .where(
        and(
          eq(gameRequests.submittedBy, userId),
          eq(gameRequests.requestType, "new_game"),
          eq(gameRequests.status, "pending"),
        ),
      ),
    db
      .select({ value: count() })
      .from(userRequests)
      .where(
        and(
          eq(userRequests.submittedBy, userId),
          eq(userRequests.requestType, "game_report_appeal"),
          eq(userRequests.status, "pending"),
        ),
      ),
  ]);

  const total = (gameResult?.value ?? 0) + (userResult?.value ?? 0);
  return total < 3;
}
