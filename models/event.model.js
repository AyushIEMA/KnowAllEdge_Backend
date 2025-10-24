// models/Event.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answers: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  imageUrl: { type: String },
});

const quizSchema = new mongoose.Schema({
  quizName: { type: String, required: true },
  onTopics: { type: [String], required: true },
  quizMaster: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  questionSwapTime: { type: Number, required: true },
  questions: [questionSchema],
});

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventStartTime: { type: Date, required: true },
  eventEndTime: { type: Date, required: true },
  quizzes: [quizSchema],
});

module.exports = mongoose.model("Event", eventSchema);
