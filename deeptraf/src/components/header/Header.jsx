import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { User, LogOut, Sun, Moon } from "lucide-react";

export default function Header({ toggleTheme, theme }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [openProfile, setOpenProfile] = useState(false);

  // Read user info
  const token = sessionStorage.getItem("token");
  const userName = sessionStorage.getItem("user_name") || "User";
  const userEmail = sessionStorage.getItem("user_email") || "No Email";

  // Highlight active button
  const navButton = (path) =>
    `px-4 py-2 rounded-md transition ${
      location.pathname === path
        ? "bg-blue-600 text-white dark:bg-yellow-400 dark:text-black"
        : "text-black dark:text-white hover:bg-blue-100 dark:hover:bg-gray-700"
    }`;

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user_name");
    sessionStorage.removeItem("user_email");
    setOpenProfile(false);
    navigate("/login");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4">

        {/* LOGO */}
        <h1 className="text-2xl font-bold text-blue-600 dark:text-yellow-400 cursor-pointer"
          onClick={() => navigate("/")}>
          DeepTraaff
        </h1>

        {/* CENTER NAVIGATION */}
        <nav className="flex space-x-2">
          <Link to="/" className={navButton("/")}>Home</Link>

          {token && (
            <>
              <Link to="/datainput" className={navButton("/datainput")}>
                Data Input
              </Link>
              <Link to="/analyzereport" className={navButton("/analyzereport")}>
                Traffic Analytics
              </Link>
            </>
          )}
        </nav>

        {/* RIGHT SIDE */}
        <div className="relative flex items-center space-x-3">

          {/* Theme Toggle
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button> */}

          {/* If NOT logged in → show Login & Sign Up */}
          {!token && (
            <>
              <Link to="/login" className={navButton("/login")}>Login</Link>
              <Link to="/signup" className={navButton("/signup")}>Sign Up</Link>
            </>
          )}

          {/* If logged in → PROFILE ICON */}
          {token && (
            <div className="relative">
              <button
                onClick={() => setOpenProfile(!openProfile)}
                className="flex items-center p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:opacity-80 transition"
              >
                <User size={22} className="text-blue-600 dark:text-yellow-400" />
              </button>

              {/* PROFILE POPUP */}
              {openProfile && (
                <div className="absolute right-0 mt-3 w-60 bg-white dark:bg-gray-800 shadow-xl rounded-xl border dark:border-gray-700 p-4 z-50">

                  <p className="font-semibold text-gray-900 dark:text-gray-200">
                    {userName || "User"}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {userEmail || "email@example.com"}
                  </p>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>

                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
