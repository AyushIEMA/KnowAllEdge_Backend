const cron = require("node-cron");
const Event = require('../models/event.model');

cron.schedule("*/10 * * * * *", async () => {
  try {
    const now = new Date();
    const events = await Event.find({ "quizzes.startTime": { $exists: true } });

    for (const event of events) {
      let modified = false;

      event.quizzes.forEach(q => {
        if (now < q.startTime && q.status !== "future") {
          q.status = "future";
          modified = true;
        }

        if (now >= q.startTime && now <= q.endTime && q.status !== "live") {
          q.status = "live";
          modified = true;
        }

        if (now > q.endTime && q.status !== "past") {
          q.status = "past";
          modified = true;
        }
      });

      if (modified) await event.save();
    }

    console.log("⏳ Quiz status synced");

  } catch (err) {
    console.error("Cron error:", err.message);
  }
});
