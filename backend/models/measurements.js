const mongoose = require("mongoose");

const MeasurementsSchema = new mongoose.Schema({
  machineName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Machine",
    required: true,
  },
  availability: { type: Number, required: true }, // percentage
  performance: { type: Number, required: true }, // percentage
  quality: { type: Number, required: true }, // percentage
  oee: { type: Number, required: true }, // percentage
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Measurements", MeasurementsSchema);
