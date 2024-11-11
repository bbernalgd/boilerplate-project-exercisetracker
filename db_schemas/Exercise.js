const mongoose = require("mongoose");

const exerciseSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: Date,
  },
  { versionKey: false }
);

const Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = Exercise;