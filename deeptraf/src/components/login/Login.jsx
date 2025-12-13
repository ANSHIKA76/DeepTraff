import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/auth/login-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await res.json();
      console.log("Login Response:", data);

      if (data.status !== "success") {
        setError(data.message || "Login failed! Check your credentials.");
      } else {
        // Save auth details
        sessionStorage.setItem("token", data.access_token);
        sessionStorage.setItem("user_name", data.user.name);
        sessionStorage.setItem("user_email", data.user.email);

        navigate("/datainput");
      }
    } catch (err) {
      setError("Something went wrong. Try again!");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition mt-20">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600 dark:text-yellow-400">
          Login to DeepTraaff
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm text-center">
            {error}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 
              bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-12 rounded-md border border-gray-300 dark:border-gray-700 
                bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-600 dark:text-gray-300"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>

            <div className="text-right mt-1">
              <Link
                to="/forgotPassword"
                className="text-sm text-blue-600 dark:text-yellow-400 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700
            dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 dark:text-gray-300">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 dark:text-yellow-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
