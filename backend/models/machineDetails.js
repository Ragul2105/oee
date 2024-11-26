const mongoose = require("mongoose");

const machineDetailsSchema = new mongoose.Schema({
  machineName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Machine",
    required: true,
  },
  partName: { type: String, required: true },
  partNumber: { type: String, required: true },
  totalCount: { type: Number, default: 0 },
  rejectedCount: { type: Number, default: 0 },
  stopTimes: [
    {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
      reason: { type: String, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Index to ensure unique entries per day
machineDetailsSchema.index({
  machineName: 1,
  partName: 1,
  partNumber: 1,
  createdAt: 1,
});

module.exports = mongoose.model("MachineDetails", machineDetailsSchema);
