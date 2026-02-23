import { Hono } from "hono";
import { db } from "../db/index";
import { requireSession, requireCompleteProfile } from "../lib/middleware";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { userRequests } from "../db/schema";
import { z } from "zod";

const userRequestRoutes = new Hono ()

//zod Schema Validation
const userRequestSchema = z.discriminatedUnion("requestType",[
    z.object({
      requestType: z.literal("user_unban_appeal"),
      appealText: z.string().min(1),
      relatedGameId: z.null().optional()
    }),
    z.object({
      requestType: z.literal("game_report_appeal"),
      appealText: z.string().min(1),
      relatedGameId: z.string().min(1)
    })
  ])

//user submits an appeal
userRequestRoutes.post(
    "/",
    requireSession,
    requireCompleteProfile,

    async (c) => {
        try{
            const user = c.get("user");
            const body = await c.req.json()

            const result = userRequestSchema.safeParse(body);
            if (!result.success) {
                return c.json(
                    {
                    error: "Invalid request",
                    details: result.error.format(),
                    },
                    400,
                );
            }
            const { requestType, relatedGameId, appealText } = result.data;

            const existing = await db.query.userRequests.findFirst({
                where: and(
                  eq(userRequests.submittedBy, user.id),
                  eq(userRequests.requestType, requestType),
                  relatedGameId ? eq(userRequests.relatedGameId, relatedGameId) : undefined,
                  eq(userRequests.status, "pending")
                )
              });


            if (existing){
                return c.json(
                    {
                        error: "Appeal already submitted",
                        message: "Your appeal has already been submitted"
                    },
                    400,
                );
            }

            const requestId = `ur_${nanoid(16)}`;

            await db.insert(userRequests).values({
                id: requestId,
                requestType: requestType,
                submittedBy: user.id,
                relatedGameId: relatedGameId ?? null,
                appealText: appealText,
                status : "pending",
            })

            return c.json({
                success: true,
                message: "User request has been submitted successfully",
            });
        }
        catch (error: any){
            console.error("An unexpected error occurred", error);
            return c.json({
                success: false,
                message: "An unexpected error occurred"
            }, 500)
        }
    }
);


export default userRequestRoutes;