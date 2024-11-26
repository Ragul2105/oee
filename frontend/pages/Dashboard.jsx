import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Typography, Grid, Paper, Container, Box } from "@mui/material";
import { Pie, Line } from "react-chartjs-2";
import axios from "axios";
import Chart from "chart.js/auto";

const Dashboard = () => {
  const { machineName } = useParams();
  const [machineDetails, setMachineDetails] = useState({});
  const [targetValue, setTargetValue] = useState(null);
  const [achievedCount, setAchievedCount] = useState(0);
  const [availability, setAvailability] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [quality, setQuality] = useState(null);
  const [oee, setOee] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [lineChartData, setLineChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch machine details
        const machineResponse = await axios.get(
          `http://localhost:5000/machines/${machineName}`
        );
        const machine = machineResponse.data;
        setMachineDetails(machine);
        setTargetValue(machine.targetValue || "N/A");

        // Fetch machine details for achieved count and pie chart
        const machineDetailsResponse = await axios.get(
          `http://localhost:5000/machine-details/${machineName}/latest`
        );
        const machineDetailsData = machineDetailsResponse.data;

        // Calculate achieved count
        const totalAchieved = machineDetailsData.reduce(
          (sum, detail) => sum + (detail.totalCount || 0),
          0
        );
        setAchievedCount(totalAchieved);

        // Prepare pie chart data
        const labels = machineDetailsData.map((detail) => detail.partName);
        const data = machineDetailsData.map((detail) => detail.totalCount);

        setPieChartData({
          labels,
          datasets: [
            {
              label: "Parts Distribution",
              data,
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
              ],
              hoverBackgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
              ],
            },
          ],
        });

        // Fetch measurements for availability, performance, quality, and OEE
        const measurementsResponse = await axios.get(
          `http://localhost:5000/machines/${machineName}/measurements`
        );
        const measurements = measurementsResponse.data;
        setAvailability((measurements.availability * 100).toFixed(2));
        setPerformance((measurements.performance * 100).toFixed(2));
        setQuality((measurements.quality * 100).toFixed(2));
        setOee((measurements.oee * 100).toFixed(2));

        // Fetch historical data for line chart
        const historicalDataResponse = await axios.get(
          `http://localhost:5000/machines/${machineName}/historical-data`
        );
        const historicalData = historicalDataResponse.data;

        setLineChartData({
          labels: historicalData.map((entry) =>
            new Date(entry.date).toLocaleDateString()
          ),
          datasets: [
            {
              label: "Target",
              data: historicalData.map((entry) => entry.target),
              borderColor: "#36A2EB",
              fill: false,
            },
            {
              label: "Achieved",
              data: historicalData.map((entry) => entry.achieved),
              borderColor: "#FF6384",
              fill: false,
            },
          ],
        });
      } catch (err) {
        console.error(err);
        alert("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [machineName]);

  if (loading) {
    return (
      <Typography variant="h6" align="center">
        Loading...
      </Typography>
    );
  }

  const { latestDetails } = machineDetails;

  return (
    <Container
      sx={{
        marginTop: "64px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Page Title */}
      <Typography variant="h4" gutterBottom>
        Dashboard for {machineName}
      </Typography>
      {/* Top Boxes */}
      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={3}
            sx={{
              padding: "16px",
              textAlign: "center",
              backgroundColor: "#f5f5f5",
              "&:hover": { backgroundColor: "#e0e0e0" },
            }}
          >
            <Typography variant="subtitle1">Part Name</Typography>
            <Typography variant="h6">
              {latestDetails?.partName || "N/A"}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={3}
            sx={{
              padding: "16px",
              textAlign: "center",
              backgroundColor: "#f5f5f5",
              "&:hover": { backgroundColor: "#e0e0e0" },
            }}
          >
            <Typography variant="subtitle1">Part Number</Typography>
            <Typography variant="h6">
              {latestDetails?.partNumber || "N/A"}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={3}
            sx={{
              padding: "16px",
              textAlign: "center",
              backgroundColor: "#f5f5f5",
              "&:hover": { backgroundColor: "#e0e0e0" },
            }}
          >
            <Typography variant="subtitle1">Target Value</Typography>
            <Typography variant="h6">{targetValue}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper
            elevation={3}
            sx={{
              padding: "16px",
              textAlign: "center",
              backgroundColor: "#f5f5f5",
              "&:hover": { backgroundColor: "#e0e0e0" },
            }}
          >
            <Typography variant="subtitle1">Achieved Count</Typography>
            <Typography variant="h6">{achievedCount}</Typography>
          </Paper>
        </Grid>
      </Grid>
      {/* Availability, Performance, Quality, and OEE */}
      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        <Grid item xs={3}>
          <Paper
            elevation={3}
            sx={{
              padding: "16px",
              textAlign: "center",
              backgroundColor: "#e3f2fd",
            }}
          >
            <Typography variant="subtitle1">Availability</Typography>
            <Typography variant="h6">{availability}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper
            elevation={3}
            sx={{
              padding: "16px",
              textAlign: "center",
              backgroundColor: "#e8f5e9",
            }}
          >
            <Typography variant="subtitle1">Performance</Typography>
            <Typography variant="h6">{performance}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper
            elevation={3}
            sx={{
              padding: "16px",
              textAlign: "center",
              backgroundColor: "#fff3e0",
            }}
          >
            <Typography variant="subtitle1">Quality</Typography>
            <Typography variant="h6">{quality}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper
            elevation={3}
            sx={{
              padding: "16px",
              textAlign: "center",
              backgroundColor: "#f3e5f5",
            }}
          >
            <Typography variant="subtitle1">OEE</Typography>
            <Typography variant="h6">{oee}%</Typography>
          </Paper>
        </Grid>
      </Grid>
      {/* Pie and Line Chart */}
      <Grid container spacing={2} sx={{ marginTop: 4 }}>
        {/* Pie Chart */}
        {pieChartData && (
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                padding: 2,
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Parts Distribution
              </Typography>
              <Box sx={{ maxWidth: "270px", margin: "0 auto" }}>
                <Pie data={pieChartData} />
              </Box>
            </Box>
          </Grid>
        )}
        {/* Line Chart */}
        {lineChartData && (
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                padding: 2,
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Target vs Achieved
              </Typography>
              <Line data={lineChartData} />
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
