import cron from "node-cron";
import { TokenModel } from "../../DB/models/Token.model.js";
import * as DBService from "../../DB/db.service.js"

export const startExpiredTokensCron = () => {
    cron.schedule("0 0 * * *", async () => {
        console.log("[CRON] Running cleanup job...");
        try {
            const nowInSeconds = Math.floor(Date.now() / 1000);

            const { deletedCount } = await DBService.deleteMany({
                model: TokenModel,
                filter: { expiresIn: { $lte: nowInSeconds } }
            });

            if (deletedCount > 0) {
                console.log(`[CRON] Deleted ${deletedCount} expired tokens`);
            }
        } catch (error) {
            console.error("[CRON] Error deleting expired tokens:", error.message);
        }
    });
};