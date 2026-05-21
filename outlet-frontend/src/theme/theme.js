import { createTheme } from "@mui/material/styles";

export const getTheme = () => {
  const isDark = localStorage.getItem("darkMode") === "true";
  const themeColor = localStorage.getItem("themeColor") || "Purple";
  const compactMode = localStorage.getItem("compactMode") === "true";
  const fontSizePref = localStorage.getItem("fontSize") || "Medium";

  let primaryMain = "#4f46e5"; // Purple
  let primaryLight = "#818cf8";
  let primaryDark = "#3730a3";

  if (themeColor === "Blue") {
    primaryMain = "#2563eb";
    primaryLight = "#60a5fa";
    primaryDark = "#1e40af";
  } else if (themeColor === "Green") {
    primaryMain = "#16a34a";
    primaryLight = "#4ade80";
    primaryDark = "#15803d";
  }

  let htmlFontSize = 16;
  if (fontSizePref === "Small") htmlFontSize = 14;
  if (fontSizePref === "Large") htmlFontSize = 18;

  return createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: {
        main: primaryMain,
        light: primaryLight,
        dark: primaryDark,
        contrastText: "#ffffff",
      },
      background: {
        default: isDark ? "#0f172a" : "#f8fafc",
        paper: isDark ? "#1e293b" : "#ffffff",
      },
      text: {
        primary: isDark ? "#f1f5f9" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#64748b",
      },
      divider: isDark ? "rgba(255,255,255,0.12)" : "rgba(226, 232, 240, 0.8)",
    },
    typography: {
      htmlFontSize,
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
      borderRadius: compactMode ? 8 : 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          body {
            background-color: ${isDark ? "#0f172a" : "#f8fafc"};
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
            borderRadius: compactMode ? 12 : 20,
            boxShadow: isDark ? "0 4px 20px -2px rgba(0, 0, 0, 0.3)" : "0 4px 20px -2px rgba(0, 0, 0, 0.03)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(226, 232, 240, 0.8)"}`,
            transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          },
        },
      },
      MuiTable: {
        defaultProps: {
          size: compactMode ? "small" : "medium",
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: compactMode ? "8px 16px" : "16px",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(226, 232, 240, 0.8)"}`
          }
        }
      },
      MuiButton: {
        defaultProps: {
          size: compactMode ? "small" : "medium",
        },
        styleOverrides: {
          root: {
            borderRadius: compactMode ? 6 : 10,
            boxShadow: "none",
            padding: compactMode ? "6px 14px" : "8px 20px",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "translateY(-1px)",
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${primaryLight} 0%, ${primaryMain} 100%)`,
            boxShadow: `0 4px 12px ${primaryMain}40`,
            "&:hover": {
              boxShadow: `0 6px 16px ${primaryMain}60`,
            }
          }
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: "none",
            background: isDark ? "#0f172a" : `linear-gradient(180deg, #0f172a 0%, ${primaryDark} 100%)`,
            color: "#ffffff",
          },
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
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
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
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f8fafc",
            }
          }
        }
      }
    },
  });
};

const defaultTheme = getTheme();
export default defaultTheme;

