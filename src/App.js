import { BrowserRouter as Router } from "react-router-dom";
import AppContent from "./routes/AppContent";
import { SnackbarProvider } from "notistack";
import { CustomThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <CustomThemeProvider>
      <SnackbarProvider
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={3000}>
        <Router>
          <AppContent/>
        </Router>
      </SnackbarProvider>
    </CustomThemeProvider>
  );
}

export default App;