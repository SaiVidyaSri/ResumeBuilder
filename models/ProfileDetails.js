const mongoose = require("mongoose");

const profileDetailsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Each user should have only one profile details entry
  },
  profilePicture: {
    type: String, // Stores the URL or path to the profile image
    default: "", // Default to an empty string or a path to a default avatar image
  },
  firstName: {
    type: String,
    trim: true,
    default: "",
  },
  lastName: {
    type: String,
    trim: true,
    default: "",
  },
  mobileNumber: {
    type: String,
    trim: true,
    default: "",
  },
  location: {
    type: String,
    trim: true,
    default: "",
  },
  profileCompletionPercentage: {
    type: Number,
    default: 0, // Default to 0% complete
    min: 0,
    max: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` field on save
profileDetailsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const ProfileDetails = mongoose.model("ProfileDetails", profileDetailsSchema);

module.exports = ProfileDetails;