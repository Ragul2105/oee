import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  Container,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const DataEntry = () => {
  const { machineName } = useParams();
  const [targetValue, setTargetValue] = useState("");
  const [idealCycleTime, setIdealCycleTime] = useState("");
  const [rejectedCount, setRejectedCount] = useState("");
  const [stopTimes, setStopTimes] = useState([
    { from: "", to: "", reason: "" },
  ]);

  // Helper to convert UTC time to IST time
  const convertToIST = (utcDate) => {
    const date = new Date(utcDate);
    const offset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    return new Date(date.getTime() + offset).toISOString().slice(11, 16); // Extract HH:mm format
  };

  // Helper to convert time from HH:mm to UTC
  const convertToUTC = (time) => {
    const [hours, minutes] = time.split(":");
    const now = new Date();
    now.setUTCHours(parseInt(hours) - 5, parseInt(minutes) - 30, 0); // Adjust for IST offset
    return now.toISOString();
  };

  // Fetch initial machine details
  useEffect(() => {
    axios
      .get(`http://localhost:5000/machines/${machineName}`)
      .then((response) => {
        const machine = response.data;
        setTargetValue(machine.targetValue || "");
        setIdealCycleTime(machine.idealCycleTime || "");
        setRejectedCount(machine.rejectedCount || "");
        setStopTimes(
          machine.stopTimes.length
            ? machine.stopTimes.map((time) => ({
                ...time,
                from: convertToIST(time.from),
                to: convertToIST(time.to),
              }))
            : [{ from: "", to: "", reason: "" }]
        );
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load machine details");
      });
  }, [machineName]);

  // Function to handle Target Value submission
  const handleTargetValueSubmit = async () => {
    try {
      await axios.patch(
        `http://localhost:5000/machines/${machineName}/target`,
        { targetValue }
      );
      alert("Target value updated successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update target value");
    }
  };

  // Function to handle Ideal Cycle Time submission
  const handleIdealCycleTimeSubmit = async () => {
    try {
      await axios.patch(
        `http://localhost:5000/machines/${machineName}/idealCycleTime`,
        { idealCycleTime }
      );
      alert("Ideal cycle time updated successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update ideal cycle time");
    }
  };

  // Handle changes to Stop Times
  const handleStopTimeChange = (index, field, value) => {
    const updatedStopTimes = [...stopTimes];
    updatedStopTimes[index][field] = value;
    setStopTimes(updatedStopTimes);
  };

  // Add new Stop Time
  const addStopTime = () => {
    setStopTimes([...stopTimes, { from: "", to: "", reason: "" }]);
  };

  // Delete a Stop Time
  const deleteStopTime = (index) => {
    const updatedStopTimes = [...stopTimes];
    updatedStopTimes.splice(index, 1);
    setStopTimes(updatedStopTimes);
  };

  // Submit Rejected Count and Stop Times
  const handleSubmitStopTimes = async () => {
    try {
      const stopTimesInUTC = stopTimes.map((time) => ({
        ...time,
        from: convertToUTC(time.from),
        to: convertToUTC(time.to),
      }));

      await axios.patch(
        `http://localhost:5000/machines/${machineName}/rejected-stop-times`,
        {
          rejectedCount,
          stopTimes: stopTimesInUTC,
        }
      );
      alert("Rejected count and stop times updated successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update rejected count and stop times");
    }
  };

  return (
    <Container
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflowY: "auto", // Ensures proper scrolling
      }}
    >
      <Paper elevation={3} sx={{ padding: 2, width: "100%", maxWidth: 600 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Data Entry for {machineName}
        </Typography>

        {/* Target Value Form */}
        <Typography variant="h6">Set Target Value</Typography>
        <TextField
          label="Target Value"
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          onClick={handleTargetValueSubmit}
          fullWidth
          sx={{ marginBottom: 2 }}
        >
          Submit Target Value
        </Button>

        {/* Ideal Cycle Time Form */}
        <Typography variant="h6">Set Ideal Cycle Time</Typography>
        <TextField
          label="Ideal Cycle Time"
          value={idealCycleTime}
          onChange={(e) => setIdealCycleTime(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          onClick={handleIdealCycleTimeSubmit}
          fullWidth
          sx={{ marginBottom: 2 }}
        >
          Submit Ideal Cycle Time
        </Button>

        {/* Rejected Count and Stop Times */}
        <Typography variant="h6">Rejected Count and Stop Times</Typography>
        <TextField
          label="Rejected Count"
          value={rejectedCount}
          onChange={(e) => setRejectedCount(e.target.value)}
          fullWidth
          margin="normal"
        />
        {stopTimes.map((stopTime, index) => (
          <Grid container spacing={2} key={index} sx={{ marginBottom: 1 }}>
            <Grid item xs={3}>
              <TextField
                type="time"
                label="Start Time"
                InputLabelProps={{ shrink: true }}
                value={stopTime.from}
                onChange={(e) =>
                  handleStopTimeChange(index, "from", e.target.value)
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                type="time"
                label="End Time"
                InputLabelProps={{ shrink: true }}
                value={stopTime.to}
                onChange={(e) =>
                  handleStopTimeChange(index, "to", e.target.value)
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Reason"
                value={stopTime.reason}
                onChange={(e) =>
                  handleStopTimeChange(index, "reason", e.target.value)
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={2} sx={{ display: "flex", alignItems: "center" }}>
              <IconButton color="error" onClick={() => deleteStopTime(index)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Button
          variant="contained"
          onClick={addStopTime}
          fullWidth
          sx={{ marginBottom: 1 }}
        >
          Add Stop Time
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmitStopTimes}
          fullWidth
          sx={{ marginBottom: 2 }}
        >
          Submit Rejected Count and Stop Times
        </Button>
      </Paper>
    </Container>
  );
};

export default DataEntry;
