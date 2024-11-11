const mongoose = require("mongoose");

const connectDB = () =>
  mongoose
    .connect(process.env.DATABASE_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB:", err));

module.exports = connectDB;