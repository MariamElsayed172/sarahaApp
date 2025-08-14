import cron from "node-cron";
import { TokenModel } from "../../DB/models/Token.model.js";

export const startExpiredTokensCron = () => {
    // Run every day at midnight
    cron.schedule("0 0 * * *", async () => {
        try {
            const nowInSeconds = Math.floor(Date.now() / 1000);

            const { deletedCount } = await TokenModel.deleteMany({
                expiresIn: { $lte: nowInSeconds }
            });

            if (deletedCount > 0) {
                console.log(`[CRON] Deleted ${deletedCount} expired tokens`);
            }
        } catch (error) {
            console.error("[CRON] Error deleting expired tokens:", error.message);
        }
    });
};