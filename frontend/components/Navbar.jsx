import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isDataEntryPage = location.pathname.startsWith("/dataentry");

  return (
    <AppBar position="sticky" sx={{ width: "100vw" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" component="div">
          Machine Dashboard
        </Typography>
        <div>
          {isDashboardPage && (
            <Button
              color="inherit"
              onClick={() =>
                navigate(location.pathname.replace("/dashboard", "/dataentry"))
              }
              sx={{ textTransform: "none", marginRight: 1 }}
            >
              Data Entry
            </Button>
          )}
          {isDataEntryPage && (
            <Button
              color="inherit"
              onClick={() =>
                navigate(location.pathname.replace("/dataentry", "/dashboard"))
              }
              sx={{ textTransform: "none", marginRight: 1 }}
            >
              Dashboard
            </Button>
          )}
          <Button
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ textTransform: "none" }}
          >
            Back to Home
          </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
