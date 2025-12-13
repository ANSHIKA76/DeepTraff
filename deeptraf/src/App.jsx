import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

// Components
import Home from "./components/home/Home";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";
import DataInput from "./components/inputData/DataInput";
import AnalyzeReport from "./components/analyzeReport/AnalyzeReport";
import Login from "./components/login/Login";
import Signup from "./components/signup/Signup";
import ForgotPassword from "./components/forgotPassword/ForgotPassword";
import ResetPassword from "./components/resetPassword/ResetPassword";
import VerifyOTP from "./components/verifyOTP/verifyOTP";
import Profile from "./components/profile/Profile";

// Context + Protected Route
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";

export default function App() {
  const [theme, setTheme] = useState(sessionStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    sessionStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Router>
      {/* 🔥 Context wraps ALL ROUTES so data never resets */}
      <DataProvider>
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 dark:text-gray-100 transition">
          
          {/* HEADER */}
          <Header 
            toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} 
            theme={theme} 
          />

          <main className="flex-grow">
            <Routes>

              {/* PUBLIC ROUTES */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgotPassword" element={<ForgotPassword />} />
              <Route path="/resetPassword" element={<ResetPassword />} />
              <Route path="/verifyOtp" element={<VerifyOTP />} />

              {/* PROTECTED ROUTES */}
              <Route element={<ProtectedRoute />}>
                <Route element={<ProtectedLayout />}>
                  <Route path="/datainput" element={<DataInput />} />
                  <Route path="/analyzereport" element={<AnalyzeReport />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>

            </Routes>
          </main>

          {/* FOOTER */}
          <Footer />

        </div>
      </DataProvider>
    </Router>
  );
}
