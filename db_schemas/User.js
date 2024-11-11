const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      set: (value) => {
        // Capitalize the first letter and make the rest lowercase
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
    },
  },
  { versionKey: false }
);

const User = mongoose.model("User", userSchema);

module.exports = User;