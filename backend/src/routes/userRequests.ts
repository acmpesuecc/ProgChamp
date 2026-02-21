import { Hono } from "hono";
import { db } from "../db/index";
import { requireSession, requireCompleteProfile } from "../lib/middleware";
import { nanoid } from "nanoid";
import { validateUserRequest } from "../lib/userRequestService";
import { userRequests } from "../db/schema";

const userRequestRoutes = new Hono ()

userRequestRoutes.post(
    "/",
    requireSession,
    requireCompleteProfile,

    async (c) => {
        try{
            const user = c.get("user");
            const body = await c.req.json()

            const {requestType, relatedGameId, appealText} = await validateUserRequest(user.id, body);

            const requestId = `ur_${nanoid(16)}`;

            await db.insert(userRequests).values({
                id: requestId,
                requestType: requestType,
                submittedBy: user.id,
                relatedGameId: relatedGameId,
                appealText: appealText,
                status : "pending",
            })

            return c.json({
                success: true,
                message: "User request has been submitted successfully",
            });
        }
        catch (error: any){
            return c.json({
                success: false,
                message: error.message || "An unexpected error occurred"
            }, 400)
        }
    }
)

export default userRequestRoutes;