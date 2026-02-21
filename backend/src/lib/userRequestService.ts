import { db } from "../db/index";
import { userRequests } from "../db/schema";
import { eq, and, count } from "drizzle-orm";

export async function validateUserRequest(userId: string, body: any) {
  const requestType = body.requestType?.trim();
  const appealText = body.appealText?.trim() ?? ""; // Ensure it's at least an empty string
  const validTypes = ["user_unban_appeal", "game_report_appeal"];

  if (!requestType) throw new Error("Request Type is required");

  if (!validTypes.includes(requestType)) {
    throw new Error("Invalid request type");
  }

  let relatedGameId: string | null = null; // Default it to null first

  if (requestType === "game_report_appeal") {
    relatedGameId = body.relatedGameId?.trim() ?? null;
    
    if (!relatedGameId) {
      throw new Error("Game ID is required for reporting a game");
    }
  } 

  const existing = await db.query.userRequests.findFirst({
    where: and(
      eq(userRequests.submittedBy, userId),
      eq(userRequests.requestType, requestType),
      
      relatedGameId ? eq(userRequests.relatedGameId, relatedGameId) : undefined,
      eq(userRequests.status, "pending")
    )
  });

  if (existing) throw new Error("You already have a pending request of this type");

  return { requestType, relatedGameId, appealText };
}