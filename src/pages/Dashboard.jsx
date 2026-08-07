import { Typography } from "@mui/material";
import MainLayout from "../layouts/MainLayout";

function Dashboard() {
  return (
    <MainLayout>
      <Typography variant="h3" fontWeight="bold">
        Welcome to Appglide SmartOps
      </Typography>

      <Typography sx={{ mt: 2 }}>
        Dashboard is under construction...
      </Typography>
    </MainLayout>
  );
}

export default Dashboard;