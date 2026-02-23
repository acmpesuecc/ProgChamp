import { Hono } from "hono";
import { db } from "../db/index";
import { gameRequests, games } from "../db/schema";
import { requireSession, requireCompleteProfile } from "../lib/middleware";
import { canUserSubmitNewGame } from "../lib/gameRequestService";
import { nanoid } from "nanoid";
import { eq, and, count } from "drizzle-orm";
import { z } from "zod"

const gameRequestsRoutes = new Hono();

//zod validation schema 
const gameSubmissionSchem = z.object({
    title: z.string().min(1).max(100),
    gameUrl: z.string().min(1),
    description: z.string().optional()

})

gameRequestsRoutes.post(
    "/",
    requireSession,
    requireCompleteProfile,
    async (c) => {
        try{
            const user = c.get("user");

            
            const body = await c.req.json()
            const result = gameSubmissionSchem.safeParse(body);
            if (!result.success) {
                return c.json(
                    {
                        error: "Invalid request",
                        details: result.error.format(),
                    },
                    400,
                );
            }
            // Check if the user already has 3 pending new game requests (Current limit 3 may change later)
            const allowed = await canUserSubmitNewGame(user.id);

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
                eq(gameRequests.status, "pending")
                )
            });
            const existingGame = await db.query.games.findFirst({
            where: eq(games.gameUrl, gameUrl)
            });
            const rejectedGame = await db.query.gameRequests.findFirst({
            where: and(
                eq(gameRequests.submittedBy, user.id),
                eq(gameRequests.gameUrl, gameUrl),
                eq(gameRequests.status, "rejected")
                )
            })

            if (existingGame) return c.json({
                 success: false, message: "Game already exists" 
                }, 400);
            if (existing) return c.json({
                 success: false, message: "Game request already submitted" 
                }, 400);
            if (rejectedGame) return c.json({
                 success: false, message: "Game request has already been rejected" 
                }, 400);

            const requestId = `gr_${nanoid(16)}`;

            await db.insert(gameRequests).values({
                id: requestId,
                requestType: "new_game",
                submittedBy: user.id,
                title: title,
                description: description,
                gameUrl: gameUrl,
                status: "pending" ,
            });
            return c.json({
                success: true,
                message: "Game request has been submitted successfully",
            });
        }
        catch (error){
            console.error("An unexpected error occured", error);
            return c.json({
                success: false,
                message: "An unexpected error occured"
            }, 500)
        }
    }
);

// User Fetches all their game requests
gameRequestsRoutes.get(
  "/my",
  requireSession,
  async (c) => {
    const user = c.get("user");
    const page = Number(c.req.query("page")) || 1;
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const [requests, totalCount] = await Promise.all([
      db.query.gameRequests.findMany({
        where: eq(gameRequests.submittedBy, user.id),
        limit: pageSize,
        offset: offset,
        orderBy: (gameRequests, { desc }) => [desc(gameRequests.createdAt)],
      }),
      db.select({ count: count() }).from(gameRequests).where(eq(gameRequests.submittedBy, user.id)),
    ]);

    const total = totalCount[0]?.count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return c.json({
      success: true,
      requests,
      meta: {
        page, pageSize, total, totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  }
);

export default gameRequestsRoutes;