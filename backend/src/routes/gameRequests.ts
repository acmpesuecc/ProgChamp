import { Hono } from "hono";
import { db } from "../db/index";
import { gameRequests } from "../db/schema";
import { requireSession, requireCompleteProfile } from "../lib/middleware";
import { validateGameSubmission, canUserSubmitNewGame } from "../lib/gameRequestService";
import { nanoid } from "nanoid";
import { eq, or, lt, and } from "drizzle-orm";

const gameRequestsRoutes = new Hono();


gameRequestsRoutes.post(
    "/",
    requireSession,
    requireCompleteProfile,
    async (c) => {
        const user = c.get("user");

        // Check if the user already has 3 pending new game requests (Current limit 3, may change later)
        const allowed = await canUserSubmitNewGame(user.id);

        if (!allowed) {
            return c.json({
                success: false,
                message: "You have reached the limit of 3 pending game submissions. Please wait for admin approval.",
            }, 429);
        }

        const body = await c.req.json()
        const { title, gameUrl, description } = await validateGameSubmission(user.id, body);

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
);

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