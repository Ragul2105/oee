import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import Home from "../pages/Home";
import DataEntry from "../pages/DataEntry";
import Dashboard from "../pages/Dashboard";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dataentry/:machineName" element={<DataEntry />} />
        <Route path="/dashboard/:machineName" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
