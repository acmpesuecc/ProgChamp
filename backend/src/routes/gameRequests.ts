import { Hono } from "hono";
import { db } from "../db/index";
import { gameRequests, games } from "../db/schema";
import { requireSession, requireCompleteProfile } from "../lib/middleware";
import { canUserSubmitRequest } from "../lib/gameRequestService";
import { nanoid } from "nanoid";
import { eq, or, lt, and } from "drizzle-orm";
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

    const user = c.get("user")
    const cursorParam = c.req.query("cursor")
    const pageSize = 20

    const conditions = [eq(gameRequests.submittedBy, user.id)]

    if (cursorParam) {
      try {
        const decoded = JSON.parse(atob(cursorParam))
        const cursorDate = new Date(decoded.createdAt)

        if (isNaN(cursorDate.getTime()) || !decoded.id) {
          return c.json({ error: "Invalid cursor" }, 400)
        }

        const cursorCondition = or(
          lt(gameRequests.createdAt, cursorDate),
          and(
            eq(gameRequests.createdAt, cursorDate),
            lt(gameRequests.id, decoded.id)
          )
        )

        if (cursorCondition) {
          conditions.push(cursorCondition)
        }
      } catch {
        return c.json({ error: "Invalid cursor" }, 400)
      }
    }

    const requests = await db.query.gameRequests.findMany({
      where: and(...conditions),
      orderBy: (gameRequests, { desc }) => [
        desc(gameRequests.createdAt),
        desc(gameRequests.id),
      ],
      limit: pageSize + 1,
    })

    const hasNextPage = requests.length > pageSize
    const page = hasNextPage ? requests.slice(0, pageSize) : requests
    const lastRequest = page.at(-1)
    const nextCursor = hasNextPage && lastRequest
      ? btoa(JSON.stringify({ createdAt: lastRequest.createdAt, id: lastRequest.id }))
      : null

    return c.json({
      success: true,
      requests: page,
      nextCursor
    })
  }
)

export default gameRequestsRoutes;