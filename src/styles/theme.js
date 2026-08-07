import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563EB",
    },
    secondary: {
      main: "#7C3AED",
    },
    background: {
      default: "#F4F7FE",
    },
  },

  typography: {
    fontFamily: "Poppins, sans-serif",
  },

  shape: {
    borderRadius: 12,
  },
});

export default theme;