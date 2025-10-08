const Joi =require('joi')
// Event validation
exports.eventSchema = Joi.object({
  eventName: Joi.string().required(),
  eventStartTime: Joi.date().required(),
  eventEndTime: Joi.date().required(),
});

// Quiz validation
exports.quizSchema = Joi.object({
  quizName: Joi.string().required(),
  onTopics: Joi.array().items(Joi.string()).required(),
  quizMaster: Joi.string().required(),
  startTime: Joi.date().required(),
  endTime: Joi.date().required(),
  questionSwapTime: Joi.number().min(0).required(),
  questions: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().required(),
        imageUrl: Joi.string().uri().optional(),
        answers: Joi.array().items(Joi.string()).required(),
        correctAnswer: Joi.string().required(),
      })
    )
    .required(),
});