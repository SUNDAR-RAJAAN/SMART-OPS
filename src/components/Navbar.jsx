import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
} from "@mui/material";

import NotificationsIcon from "@mui/icons-material/Notifications";

function Navbar() {
  return (
    <AppBar
      position="fixed"
      sx={{
        ml: "240px",
        width: "calc(100% - 240px)",
        background: "white",
        color: "black",
        boxShadow: 1,
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Dashboard
        </Typography>

        <IconButton>
          <NotificationsIcon />
        </IconButton>

        <Box ml={2}>
          <Avatar>J</Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;