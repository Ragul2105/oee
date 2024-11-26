const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Machine = require("./models/machine");
const MachineDetails = require("./models/machineDetails");
const Measurements = require("./models/measurements");
require("./connection");

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors());

// Helper Function to Get Current IST Date
const getCurrentISTDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istDate = new Date(now.getTime() + istOffset);
  return new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate()); // Return date part only
};

// APIs

// Get all machines
app.get("/machines", async (req, res) => {
  try {
    const machines = await Machine.find();
    res.status(200).json(machines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new machine
app.post("/machines", async (req, res) => {
  try {
    const { name } = req.body;
    const newMachine = new Machine({ name });
    const savedMachine = await newMachine.save();
    res.status(201).json(savedMachine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get machine details
app.get("/machines/:machineName", async (req, res) => {
  try {
    const { machineName } = req.params;

    // Fetch the machine by its name
    const machine = await Machine.findOne({ name: machineName });
    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    // Fetch the latest MachineDetails for this machine
    const latestDetails = await MachineDetails.findOne({
      machineName: machine._id,
    }).sort({ createdAt: -1 }); // Sort by creation time (latest first)

    const response = {
      ...machine.toObject(), // Convert Mongoose document to plain object
      latestDetails: latestDetails || null, // Include the latest MachineDetails, or null if not available
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Update target value for a specific machine
app.patch("/machines/:machineName/target", async (req, res) => {
  try {
    const { machineName } = req.params;
    const { targetValue } = req.body;

    const machine = await Machine.findOneAndUpdate(
      { name: machineName },
      { $set: { targetValue } },
      { new: true }
    );

    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    res
      .status(200)
      .json({ message: "Target value updated successfully", machine });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update ideal cycle time for a specific machine
app.patch("/machines/:machineName/idealCycleTime", async (req, res) => {
  try {
    const { machineName } = req.params;
    const { idealCycleTime } = req.body;

    const machine = await Machine.findOneAndUpdate(
      { name: machineName },
      { $set: { idealCycleTime } },
      { new: true }
    );

    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    res
      .status(200)
      .json({ message: "Ideal cycle time updated successfully", machine });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to calculate OEE
async function calculateOEE(machineName) {
    const plannedProductionTime = 8*60; // in minutes

    // Fetch machine data
    const machine = await Machine.findOne({ name: machineName });
    if (!machine) throw new Error("Machine not found");

    const stopTime = machine.stopTimes.reduce((total, time) => {
        const from = new Date(time.from);
        const to = new Date(time.to);
        return total + (to - from) / (1000 * 60); // Convert milliseconds to minutes
    }, 0) ; // Convert minutes to hours

    const runTime = plannedProductionTime - stopTime;

    // Fetch total count and calculate good count
    const today = new Date().toISOString().split("T")[0];
    const machineDetails = await MachineDetails.find({
        machineName: machine._id,
        createdAt: { $gte: new Date(today), $lt: new Date(today + "T23:59:59") },
    });

    const totalCount = machineDetails.reduce((total, detail) => total + detail.totalCount, 0);
    const goodCount = totalCount - machine.rejectedCount;

    // Calculate metrics
    const availability = runTime / plannedProductionTime;
    const performance = (machine.idealCycleTime * totalCount) / (runTime*60);
    const quality = goodCount / totalCount;
    const oee = availability * performance * quality;

    return { availability, performance, quality, oee };
}

// Update Measurements when stopTimes or rejectedCount is updated
async function updateMeasurements(machineName) {
    const metrics = await calculateOEE(machineName);

    const today = new Date().toISOString().split("T")[0];
    const machine = await Machine.findOne({ name: machineName });

    const existingMeasurement = await Measurements.findOne({
        machineName: machine._id,
        createdAt: { $gte: new Date(today), $lt: new Date(today + "T23:59:59") },
    });

    if (existingMeasurement) {
        existingMeasurement.availability = metrics.availability;
        existingMeasurement.performance = metrics.performance;
        existingMeasurement.quality = metrics.quality;
        existingMeasurement.oee = metrics.oee;
        await existingMeasurement.save();
    } else {
        const newMeasurement = new Measurements({
            machineName: machine._id,
            availability: metrics.availability,
            performance: metrics.performance,
            quality: metrics.quality,
            oee: metrics.oee,
            createdAt: new Date(),
        });
        await newMeasurement.save();
    }
}

// Update rejectedCount and stopTimes for a specific machine
app.patch("/machines/:machineName/rejected-stop-times", async (req, res) => {
    try {
        const { machineName } = req.params;
        const { rejectedCount, stopTimes } = req.body;

        const machine = await Machine.findOneAndUpdate(
            { name: machineName },
            { $set: { rejectedCount, stopTimes } },
            { new: true }
        );

        if (!machine) {
            return res.status(404).json({ error: "Machine not found" });
        }

        await updateMeasurements(machineName);

        res.status(200).json({ message: "Metrics updated successfully", machine });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Add or update machine details
app.post("/machine-details", async (req, res) => {
  try {
    const { machineName, partName, partNumber, totalCount } = req.body;
    const existingMachine = await Machine.findOne({ name: machineName });

    if (!existingMachine) {
      return res.status(400).json({ error: "Machine not found" });
    }

    // Ensure only one entry per day for the combination of machineName, partName, and partNumber
    const currentDate = getCurrentISTDate();
    const existingDetail = await MachineDetails.findOne({
      machineName: existingMachine._id,
      partName,
      partNumber,
      createdAt: {
        $gte: currentDate, // Start of the current day
        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000), // Start of the next day
      },
    });

    if (existingDetail) {
      // Update the existing record
      existingDetail.totalCount = totalCount || existingDetail.totalCount;
      const updatedDetail = await existingDetail.save();
      return res
        .status(200)
        .json({
          message: "Machine details updated successfully",
          updatedDetail,
        });
    }

    // Create a new record if no existing record for today
    const newDetail = new MachineDetails({
      machineName: existingMachine._id,
      partName,
      partNumber,
      totalCount,
    });

    const savedDetail = await newDetail.save();
    res
      .status(201)
      .json({ message: "Machine details added successfully", savedDetail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Handle spark data
app.post('/spark/data', async (req, res) => {
    try {
        const { machinename, partname, partnumber, count } = req.body;

        // Ensure machine exists
        let machine = await Machine.findOne({ name: machinename });
        if (!machine) {
            machine = new Machine({ name: machinename });
            await machine.save();
        }

        // Calculate today's date in IST
        const currentIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const startOfDay = new Date(currentIST.setHours(0, 0, 0, 0));
        const endOfDay = new Date(currentIST.setHours(23, 59, 59, 999));

        // Ensure machine details exist for today
        let machineDetail = await MachineDetails.findOne({
            machineName: machine._id,
            partName: partname,
            partNumber: partnumber,
            createdAt: { $gte: startOfDay, $lte: endOfDay }, // Ensure the record is for today
        });

        if (!machineDetail) {
            machineDetail = new MachineDetails({
                machineName: machine._id,
                partName: partname,
                partNumber: partnumber,
                totalCount: count, // Initialize with the incoming count
            });
            await machineDetail.save();
        } else {
            // Update totalCount if machine detail exists
            machineDetail.totalCount += count;
            await machineDetail.save();
        }

        // Ensure measurements exist
        let measurement = await Measurements.findOne({ machineName: machine._id });
        if (!measurement) {
            measurement = new Measurements({
                machineName: machine._id,
                availability: 0, // Default percentage
                performance: 0, // Default percentage
                quality: 0, // Default percentage
                oee: 0, // Default percentage
            });
            await measurement.save();
        }

        res.status(200).json({
            message: "Data processed successfully",
            machineDetail,
            measurement,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Backend Route to Get Achieved Count for a Specific Machine
app.get("/machines/:machineName/achieved-count", async (req, res) => {
    try {
        const { machineName } = req.params;

        // Find the machine by name
        const machine = await Machine.findOne({ name: machineName });
        if (!machine) {
            return res.status(404).json({ error: "Machine not found" });
        }

        // Fetch MachineDetails for the specific machine on the latest date
        const latestDetails = await MachineDetails.aggregate([
            { $match: { machineName: machine._id } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" },
                    },
                    totalAchievedCount: { $sum: "$totalCount" },
                },
            },
            { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
            { $limit: 1 },
        ]);

        if (!latestDetails.length) {
            return res.status(404).json({ error: "No details found for the machine" });
        }

        res.status(200).json({ achievedCount: latestDetails[0].totalAchievedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get the latest details for a specific machine
app.get("/machine-details/:machineName/latest", async (req, res) => {
    try {
        const { machineName } = req.params;

        // Find the machine
        const machine = await Machine.findOne({ name: machineName });
        if (!machine) {
            return res.status(404).json({ error: "Machine not found" });
        }

        // Fetch all machine details for this machine
        const details = await MachineDetails.find({ machineName: machine._id });

        if (!details.length) {
            return res.status(404).json({ error: "No details found for this machine" });
        }

        // Find the latest date from machine details
        const latestDate = new Date(
            Math.max(...details.map((detail) => new Date(detail.createdAt)))
        );

        // Filter details for the latest date
        const latestDetails = details.filter(
            (detail) =>
                new Date(detail.createdAt).toDateString() === latestDate.toDateString()
        );

        res.status(200).json(latestDetails);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch historical target and achieved data
app.get('/machines/:machineName/historical-data', async (req, res) => {
    try {
        const { machineName } = req.params;

        // Find the machine
        const machine = await Machine.findOne({ name: machineName });
        if (!machine) {
            return res.status(404).json({ error: "Machine not found" });
        }

        // Fetch machine details grouped by day
        const machineDetails = await MachineDetails.aggregate([
            { $match: { machineName: machine._id } },
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: "$createdAt" },
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                    totalAchieved: { $sum: "$totalCount" },
                    date: { $first: "$createdAt" },
                },
            },
            { $sort: { "date": 1 } },
        ]);

        // Combine with target values
        const historicalData = machineDetails.map((detail) => ({
            date: detail.date,
            target: machine.targetValue, // Assuming the target remains constant
            achieved: detail.totalAchieved,
        }));

        res.status(200).json(historicalData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get measurements for availability, performance, and quality for a specific machine
app.get("/machines/:machineName/measurements", async (req, res) => {
  try {
    const { machineName } = req.params;

    // Find the machine by name
    const machine = await Machine.findOne({ name: machineName });
    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    // Fetch the latest measurements for the machine
    const latestMeasurement = await Measurements.findOne({
      machineName: machine._id,
    })
      .sort({ createdAt: -1 }) // Get the most recent entry
      .limit(1); // Ensure only one document is fetched

    if (!latestMeasurement) {
      return res.status(404).json({ error: "Measurements not found" });
    }

    res.status(200).json({
      availability: latestMeasurement.availability || 0,
      performance: latestMeasurement.performance || 0,
      quality: latestMeasurement.quality || 0,
      oee: latestMeasurement.oee || 0,
    });
   
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// Get parts data for the latest entered day for a machine (for pie chart)
app.get("/machines/:machineName/parts-data", async (req, res) => {
  try {
    const { machineName } = req.params;

    // Find the machine by its name
    const machine = await Machine.findOne({ name: machineName });
    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    // Fetch all MachineDetails for this machine
    const allMachineDetails = await MachineDetails.find({
      machineName: machine._id,
    });

    if (allMachineDetails.length === 0) {
      return res.status(200).json({ partsData: [] }); // No details available
    }

    // Determine the latest date from the machine details
    const latestDate = new Date(
      Math.max(...allMachineDetails.map((detail) => detail.createdAt))
    );

    // Filter details for the latest date
    const latestDayDetails = allMachineDetails.filter((detail) => {
      const createdAtDate = new Date(detail.createdAt);
      return (
        createdAtDate.toISOString().split("T")[0] ===
        latestDate.toISOString().split("T")[0]
      );
    });

    // Map part data for the pie chart
    const partsData = latestDayDetails.map((detail) => ({
      partName: detail.partName,
      totalCount: detail.totalCount,
    }));

    res.status(200).json({ partsData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
