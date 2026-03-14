import { Hono } from "hono";
import { db } from "../db/index";
import { requireSession } from "../lib/middleware";
import { nanoid } from "nanoid";
import { eq, and, count } from "drizzle-orm";
import { userRequests } from "../db/schema";
import { z } from "zod";

const userRequestRoutes = new Hono();

// Max number of appeals a user can submit per type (lifetime, not just pending)
const MAX_UNBAN_APPEALS = 3;
const MAX_GAME_REPORT_APPEALS = 5;

const userRequestSchema = z.discriminatedUnion("requestType", [
  z.object({
    requestType: z.literal("user_unban_appeal"),
    appealText: z.string().min(1),
    relatedGameId: z.null().optional(),
  }),
  z.object({
    requestType: z.literal("game_report_appeal"),
    appealText: z.string().min(1),
    relatedGameId: z.string().min(1),
  }),
]);

// User submits an appeal
// Note: requireCompleteProfile intentionally omitted — a banned user with an
// incomplete profile must still be able to submit an unban appeal
userRequestRoutes.post(
  "/",
  requireSession,
  async (c) => {
    try {
      const user = c.get("user");
      const body = await c.req.json();

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

      // Check lifetime appeal count for this type
      const [totalResult] = await db
        .select({ value: count() })
        .from(userRequests)
        .where(
          and(
            eq(userRequests.submittedBy, user.id),
            eq(userRequests.requestType, requestType),
          ),
        );

      const totalAppeals = totalResult?.value ?? 0;
      const limit =
        requestType === "user_unban_appeal"
          ? MAX_UNBAN_APPEALS
          : MAX_GAME_REPORT_APPEALS;

      if (totalAppeals >= limit) {
        return c.json(
          {
            error: "Appeal limit reached",
            message: `You have reached the maximum of ${limit} appeals for this type.`,
          },
          429,
        );
      }

      // Check if a pending appeal already exists for this exact case
      const existing = await db.query.userRequests.findFirst({
        where: and(
          eq(userRequests.submittedBy, user.id),
          eq(userRequests.requestType, requestType),
          relatedGameId
            ? eq(userRequests.relatedGameId, relatedGameId)
            : undefined,
          eq(userRequests.status, "pending"),
        ),
      });

      if (existing) {
        return c.json(
          {
            error: "Appeal already submitted",
            message: "Your appeal has already been submitted and is pending review.",
          },
          400,
        );
      }

      const requestId = `ur_${nanoid(16)}`;

      await db.insert(userRequests).values({
        id: requestId,
        requestType,
        submittedBy: user.id,
        relatedGameId: relatedGameId ?? null,
        appealText,
        status: "pending",
      });

      return c.json({
        success: true,
        message: "User request has been submitted successfully",
      });
    } catch (error: any) {
      console.error("An unexpected error occurred", error);
      return c.json(
        {
          success: false,
          message: "An unexpected error occurred",
        },
        500,
      );
    }
  },
);

export default userRequestRoutes;