import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Grid,
  Card,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
} from "@mui/material";

import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import DashboardIcon from "@mui/icons-material/Dashboard";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    navigate("/dashboard");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0F172A,#1E3A8A,#6D28D9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Grid
        container
        sx={{
          maxWidth: 1250,
          height: "85vh",
          bgcolor: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          borderRadius: 5,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
        }}
      >
        {/* LEFT PANEL */}

        <Grid
          item
          md={7}
          xs={12}
          sx={{
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: 8,
          }}
        >
          <DashboardIcon sx={{ fontSize: 70, mb: 3 }} />

          <Typography
            variant="h2"
            fontWeight="bold"
            sx={{ mb: 2 }}
          >
            Appglide SmartOps
          </Typography>

          <Typography
            variant="h5"
            sx={{
              color: "#dbeafe",
              mb: 5,
            }}
          >
            Smart Internal Task & Workflow Management
          </Typography>

          <Typography
            sx={{
              fontSize: 20,
              lineHeight: 2,
              color: "#E2E8F0",
            }}
          >
            ✔ Task Management
            <br />
            ✔ Team Collaboration
            <br />
            ✔ Verification Workflow
            <br />
            ✔ Reports & Analytics
            <br />
            ✔ Discord Notifications
          </Typography>
        </Grid>

        {/* RIGHT PANEL */}

        <Grid
          item
          md={5}
          xs={12}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "rgba(255,255,255,.08)",
          }}
        >
          <Card
            sx={{
              width: 420,
              p: 5,
              borderRadius: 5,
              bgcolor: "rgba(255,255,255,.15)",
              backdropFilter: "blur(30px)",
              boxShadow: "0 20px 40px rgba(0,0,0,.25)",
            }}
          >
            <Typography
              variant="h4"
              align="center"
              fontWeight="bold"
              color="white"
            >
              Welcome Back 👋
            </Typography>

            <Typography
              align="center"
              sx={{
                color: "#CBD5E1",
                mb: 4,
              }}
            >
              Sign in to continue
            </Typography>

            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),

                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                    >
                      {showPassword ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 4,
                py: 1.6,
                fontSize: 18,
                borderRadius: 3,
                background:
                  "linear-gradient(90deg,#2563EB,#7C3AED)",
              }}
              onClick={handleLogin}
            >
              LOGIN
            </Button>

            <Typography
              align="center"
              sx={{
                mt: 4,
                color: "#CBD5E1",
              }}
            >
              © 2026 Appglide SmartOps
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Login;