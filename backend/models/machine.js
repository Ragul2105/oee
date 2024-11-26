const mongoose = require("mongoose");

const machineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  targetValue: { type: Number, default: 0 },
  idealCycleTime: { type: Number, default: 0 },
  rejectedCount: { type: Number, default: 0 },
  stopTimes: { type: Array, default: [] }, // Array of objects {from, to, reason}
});

module.exports = mongoose.model("Machine", machineSchema);
