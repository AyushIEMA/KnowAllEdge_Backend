const cron = require("node-cron");
const Event = require("../models/event.model");

cron.schedule("*/10 * * * * *", async () => {
  try {
    const now = new Date();
    const events = await Event.find({});

    for (const event of events) {
      let changed = false;

      // 🔵 Event status
      if (now < event.eventStartTime && event.status !== "future") {
        event.status = "future";
        changed = true;
      }

      if (
        now >= event.eventStartTime &&
        now <= event.eventEndTime &&
        event.status !== "live"
      ) {
        event.status = "live";
        changed = true;
      }

      if (now > event.eventEndTime && event.status !== "past") {
        event.status = "past";
        changed = true;
      }

      // 🔴 Quiz status
      event.quizzes.forEach(q => {
        if (now < q.startTime && q.status !== "future") {
          q.status = "future";
          changed = true;
        }

        if (now >= q.startTime && now <= q.endTime && q.status !== "live") {
          q.status = "live";
          changed = true;
        }

        if (now > q.endTime && q.status !== "past") {
          q.status = "past";
          changed = true;
        }
      });

      if (changed) await event.save();
    }

  } catch (err) {
    console.error("Cron error:", err.message);
  }
});
