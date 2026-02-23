import { db } from "../db/index";
import { NotFoundError, InvalidStateError } from "../lib/errors";
import { games } from "../db/schema"
import { eq } from "drizzle-orm";

export async function getGame(id: string) {
    const game = await db.query.games.findFirst({
        where : eq (games.id, id)
    })

    if (!game) {
            throw new NotFoundError(`Game not found `);
        }
    if (!game.isActive) {
            throw new InvalidStateError(`Game is deactivated `);
        }
    
        return game

}

