import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4f46e5", // Indigo/Purple
      light: "#818cf8",
      dark: "#3730a3",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    divider: "rgba(226, 232, 240, 0.8)",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em" },
    h2: { fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontSize: "0.875rem", fontWeight: 600 },
    subtitle2: { fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
    body1: { fontSize: "0.875rem" }, 
    body2: { fontSize: "0.8125rem", fontWeight: 500 },
    caption: { fontSize: "0.75rem", fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background-color: #f8fafc;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          min-height: 100vh;
        }
      `,
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 20,
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "none",
          padding: "8px 20px",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(79, 70, 229, 0.4)",
          }
        }
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "none",
          background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
          color: "#ffffff",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(90deg, #0f172a 0%, #1e1b4b 100%)",
          backdropFilter: "saturate(200%) blur(20px)",
          borderBottom: "none",
          color: "#ffffff",
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          fontWeight: 500,
          borderRadius: 8,
          margin: "4px 8px",
          padding: "8px 16px",
          "&:hover": {
            backgroundColor: "#f1f5f9",
          }
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: "4px 12px",
          padding: "10px 16px",
          "&:hover": {
            backgroundColor: "#f8fafc",
          }
        }
      }
    }
  },
});

export default theme;

