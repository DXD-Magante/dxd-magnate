import { BrowserRouter as Router } from "react-router-dom";
import AppContent from "./routes/AppContent";
import { SnackbarProvider } from "notistack";
import { CustomThemeProvider } from "./context/ThemeContext";
import { NavigationProvider } from "./context/NavigationContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
    <CustomThemeProvider>
      <NavigationProvider>
      <SnackbarProvider
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={3000}>
        <Router>
          <AppContent/>
        </Router>
      </SnackbarProvider>
      </NavigationProvider>
    </CustomThemeProvider>
    </AuthProvider>
  );
}

export default App;