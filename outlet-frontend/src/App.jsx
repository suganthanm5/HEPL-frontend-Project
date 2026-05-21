import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useState, useEffect } from "react";
import { getTheme } from "./theme/theme";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  const [activeTheme, setActiveTheme] = useState(getTheme());

  useEffect(() => {
    const applyGlobalCSSVariables = (newTheme) => {
      const root = document.documentElement;
      root.style.setProperty('--color-primary-main', newTheme.palette.primary.main);
      root.style.setProperty('--color-primary-light', newTheme.palette.primary.light);
      root.style.setProperty('--color-primary-dark', newTheme.palette.primary.dark);
    };

    const handleStorageEvent = () => {
      const newTheme = getTheme();
      setActiveTheme(newTheme);
      applyGlobalCSSVariables(newTheme);
    };

    handleStorageEvent();
    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("settingsUpdated", handleStorageEvent);
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("settingsUpdated", handleStorageEvent);
    };
  }, []);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
