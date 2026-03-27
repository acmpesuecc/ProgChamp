import { Hono } from "hono";
import { db } from "../db/index";
import { gameRequests, games } from "../db/schema";
import { requireSession, requireCompleteProfile } from "../lib/middleware";
import { canUserSubmitRequest } from "../lib/gameRequestService";
import { nanoid } from "nanoid";
import { eq, or, lt, and } from "drizzle-orm";
import { z } from "zod";
import { uploadToR2 } from "../lib/r2";
import { gameMedia } from "../db/schema";

const gameRequestsRoutes = new Hono();

const gameSubmissionSchema = z.object({
  title: z.string().min(1).max(100),
  gameUrl: z.string().url(),
  description: z.string().optional(),
});

gameRequestsRoutes.post(
  "/",
  requireSession,
  requireCompleteProfile,
  async (c) => {
    try {
      const user = c.get("user");

      const body = await c.req.parseBody();

      const result = gameSubmissionSchema.safeParse({
        title: body.title,
        gameUrl: body.gameUrl,
        description: body.description || undefined,
      });

      if (!result.success) {
        return c.json({ error: "Invalid request", details: result.error.format() }, 400);
      }

      const allowed = await canUserSubmitRequest(user.id);
      if (!allowed) {
        return c.json({
          success: false,
          message: "You have reached the limit of 3 pending game submissions. Please wait for admin approval.",
        }, 429);
      }

      const { title, gameUrl, description } = result.data;

      const existing = await db.query.gameRequests.findFirst({
        where: and(
          eq(gameRequests.submittedBy, user.id),
          eq(gameRequests.gameUrl, gameUrl),
          eq(gameRequests.status, "pending"),
        ),
      });

      const existingGame = await db.query.games.findFirst({
        where: eq(games.gameUrl, gameUrl),
      });

      const rejectedGame = await db.query.gameRequests.findFirst({
        where: and(
          eq(gameRequests.submittedBy, user.id),
          eq(gameRequests.gameUrl, gameUrl),
          eq(gameRequests.status, "rejected"),
        ),
      });

      if (existingGame) return c.json({ success: false, message: "Game already exists" }, 400);
      if (existing) return c.json({ success: false, message: "Game request already submitted" }, 400);
      if (rejectedGame) return c.json({ success: false, message: "Game request has already been rejected" }, 400);

      const requestId = `gr_${nanoid(16)}`;

      // Handle thumbnail
      const thumbnailFile = body.thumbnail instanceof File ? body.thumbnail : null;
      const videoFile = body.video instanceof File ? body.video : null;

      // Validate file sizes
      const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5MB
      const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50MB

      if (thumbnailFile && thumbnailFile.size > MAX_IMAGE_SIZE) {
        return c.json({ success: false, message: "Thumbnail must be under 5MB" }, 400);
      }
      if (videoFile && videoFile.size > MAX_VIDEO_SIZE) {
        return c.json({ success: false, message: "Video must be under 50MB" }, 400);
      }
      if (thumbnailFile && !thumbnailFile.type.startsWith("image/")) {
        return c.json({ success: false, message: "Thumbnail must be an image" }, 400);
      }
      if (videoFile && !videoFile.type.startsWith("video/")) {
        return c.json({ success: false, message: "Video must be a video file" }, 400);
      }

      // Insert game request
      await db.insert(gameRequests).values({
        id: requestId,
        requestType: "new_game",
        submittedBy: user.id,
        title,
        description,
        gameUrl,
        status: "pending",
      });

      // Upload thumbnail to R2 and insert media row
      let coverMediaId: string | null = null;

      if (thumbnailFile) {
        const ext = thumbnailFile.name.split('.').pop() ?? 'jpg';
        const r2Key = `game-requests/${requestId}/cover.${ext}`;
        const buffer = await thumbnailFile.arrayBuffer();
        await uploadToR2(r2Key, buffer, thumbnailFile.type);

        const mediaId = `gm_${nanoid(16)}`;
        await db.insert(gameMedia).values({
          id: mediaId,
          gameRequestId: requestId,
          mediaType: "image",
          r2Key,
          isCover: true,
          sortOrder: 0,
        });
        coverMediaId = mediaId;
      }

      // Upload video to R2 and insert media row
      if (videoFile) {
        const ext = videoFile.name.split('.').pop() ?? 'mp4';
        const r2Key = `game-requests/${requestId}/video.${ext}`;
        const buffer = await videoFile.arrayBuffer();
        await uploadToR2(r2Key, buffer, videoFile.type);

        const mediaId = `gm_${nanoid(16)}`;
        await db.insert(gameMedia).values({
          id: mediaId,
          gameRequestId: requestId,
          mediaType: "video",
          r2Key,
          isCover: false,
          sortOrder: 1,
        });
      }

      // Update coverMediaId if thumbnail was uploaded
      if (coverMediaId) {
        await db.update(gameRequests)
          .set({ coverMediaId })
          .where(eq(gameRequests.id, requestId));
      }

      return c.json({
        success: true,
        message: "Game request has been submitted successfully",
        requestId,
      });

    } catch (error) {
      console.error("An unexpected error occurred", error);
      return c.json({ success: false, message: "An unexpected error occurred" }, 500);
    }
  },
);

// User fetches all their game requests
gameRequestsRoutes.get("/my", requireSession, async (c) => {
  const user = c.get("user");
  const cursorParam = c.req.query("cursor");
  const pageSize = 20;

  const conditions = [eq(gameRequests.submittedBy, user.id)];

  if (cursorParam) {
    try {
      const decoded = JSON.parse(atob(cursorParam));
      const cursorDate = new Date(decoded.createdAt);

      if (isNaN(cursorDate.getTime()) || !decoded.id) {
        return c.json({ error: "Invalid cursor" }, 400);
      }

      const cursorCondition = or(
        lt(gameRequests.createdAt, cursorDate),
        and(
          eq(gameRequests.createdAt, cursorDate),
          lt(gameRequests.id, decoded.id),
        ),
      );

      if (cursorCondition) {
        conditions.push(cursorCondition);
      }
    } catch {
      return c.json({ error: "Invalid cursor" }, 400);
    }
  }

  const requests = await db.query.gameRequests.findMany({
    where: and(...conditions),
    orderBy: (gameRequests, { desc }) => [
      desc(gameRequests.createdAt),
      desc(gameRequests.id),
    ],
    limit: pageSize + 1,
    // Eagerly load media and tags — avoids N+1 on list queries
    with: {
      media: true,
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });

  const hasNextPage = requests.length > pageSize;
  const page = hasNextPage ? requests.slice(0, pageSize) : requests;
  const lastRequest = page.at(-1);
  const nextCursor =
    hasNextPage && lastRequest
      ? btoa(
          JSON.stringify({
            createdAt: lastRequest.createdAt,
            id: lastRequest.id,
          }),
        )
      : null;

  return c.json({
    success: true,
    requests: page,
    nextCursor,
  });
});

export default gameRequestsRoutes;
