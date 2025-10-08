const mongoose=require('mongoose')


const quizSchema = new mongoose.Schema({
  quizName: { type: String, required: true },
  onTopics: { type: [String], required: true },
  quizMaster: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  questions: [
    {
      question: { type: String, required: true },
      imageUrl: { type: String }, // Optional image URL
      answers: [{ type: String, required: true }],
      correctAnswer: { type: String, required: true },
    },
  ],
  questionSwapTime: { type: Number, required: true },
});

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventStartTime: { type: Date, required: true },
  eventEndTime: { type: Date, required: true },
  quizzes: [quizSchema],
});

module.exports = mongoose.model('Event', eventSchema);