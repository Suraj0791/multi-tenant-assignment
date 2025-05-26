import cron from "node-cron";
import { checkAndUpdateExpiredTasks } from "../utils/taskExpiry.js";

// Run every hour
const scheduleTaskExpiryCheck = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running scheduled task expiry check...");
      const expiredCount = await checkAndUpdateExpiredTasks();
      console.log(`Updated ${expiredCount} expired tasks`);
    } catch (error) {
      console.error("Error in scheduled task expiry check:", error);
    }
  });
};

export default scheduleTaskExpiryCheck;
