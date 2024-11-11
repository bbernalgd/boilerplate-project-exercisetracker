require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;

const moment = require("moment");
const mongoose = require("mongoose");
const connectDB = require("./db");
const { User, Exercise } = require("./db_schemas");

const ErrorHandler = require("./middleware/ErrorHandler");

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

const generateError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

app.get("/", (_, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// GET request to /api/users to get a list of all users
app.get("/api/users", async (_, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch {
    next(
      generateError(
        "Error retrieving users, could not connect to MongoDB.",
        500
      )
    );
  }
});

// POST to /api/users with form data username to create a new user
app.post("/api/users", async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== "string" || username.length < 3) {
      return next(
        generateError(
          "Invalid username. It must be a string with at least 3 characters.",
          400
        )
      );
    }

    const user = await User.create({ username });
    res.status(201).json(user);
  } catch (err) {
    const messsage =
      err.code === 11000 ? "User already exists" : "Server error";
    const statusCode = err.code === 11000 ? 400 : 500;
    next(generateError(messsage, statusCode));
  }
});

// POST to /api/users/:_id/exercises with form data description, duration, and optionally date.
// If no date is supplied, the current date will be used
app.post("/api/users/:_id/exercises", async (req, res, next) => {
  const { _id: userId } = req.params;
  let { duration, description, date } = req.body;

  try {
    // Validate the MongoDB format for userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(
        generateError(
          "Invalid or missing ID. The ID must be exactly 24 characters long.",
          400
        )
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(
        generateError("User not found. Please check the ID and try again.", 404)
      );
    }

    if (!description || !duration) {
      return next(
        generateError(
          "Description and duration are required. Please provide them and try again.",
          400
        )
      );
    }

    // Check if date is in the correct format yyyy-mm-dd
    const isValidFormat = (date) => {
      return moment(date, "YYYY-MM-DD", true).isValid();
    };

    if (date && !isValidFormat(date)) {
      return next(
        generateError(
          "Invalid date. Please use the yyyy-mm-dd format and ensure date is a valid calendar date.",
          400
        )
      );
    }

    date = date ? moment(date) : moment().local().format();

    const addExercise = await Exercise.create({
      userId,
      duration,
      description,
      date,
    });

    const formattedDate = {
      ...addExercise.toObject(),
      date: moment(addExercise.date).format("YYYY-MM-DD"),
    };

    res.status(200).json(formattedDate);
  } catch {
    next(generateError("Server error", 500));
  }
});

// GET request to /api/users/:_id/logs to retrieve a full exercise log of any user
app.get("/api/users/:_id/logs", async (req, res, next) => {
  const { _id: userId } = req.params;

  // You can add from, to and limit parameters to a GET
  // Example: /api/users/:_id/logs?from=2024-10-31&to=2024-10-31&limit=2
  // this request will be used to retrieve part of the log of any user.
  //from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.
  let { from, to, limit } = req.query;

  let dateFilters = {};
  let filter = { userId };

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(
        generateError("User not found. Please check the ID and try again.", 404)
      );
    }

    const formatDate = (date) => moment(date).format("YYYY-MM-DD");

    if (from) dateFilters.$gte = formatDate(from);
    if (to) dateFilters.$lte = formatDate(to);
    if (Object.keys(dateFilters).length > 0) filter.date = dateFilters;

    !limit ? (limit = 20) : limit == 0 ? (limit = 1) : limit;

    let exercises = await Exercise.find(filter).limit(limit);

    if (exercises.length == 0) {
      from || to
        ? next(
            generateError(
              "No exercises found for the specified dates. Please adjust the date range and try again.",
              404
            )
          )
        : next(
            generateError(
              "Exercises not found for this user. Please check the exercises of another user.",
              404
            )
          );
    }

    exercises = exercises.map(({ description, duration, date }) => ({
      description,
      duration,
      date: formatDate(date),
    }));

    res.status(200).json({
      username: user.username,
      count: exercises.length,
      _id: userId,
      log: exercises,
    });
  } catch {
    return next(generateError("Error retrieving exercises", 500));
  }
});

app.all("*", (req, _, next) => {
  const currentPath = req.originalUrl;

  currentPath == "/api/users//exercises"
    ? next(
        generateError(
          "Invalid ID format. Ensure the ID is exactly 24 characters long and corresponds to an existing user.",
          400
        )
      )
    : next(
        generateError(
          `The requested path '${currentPath}' was not found on this server.`,
          404
        )
      );
});

app.use(ErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
