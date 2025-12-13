import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (data.status !== "otp_sent") {
        setError(data.message || "Signup failed!");
      } else {
        // Save email for OTP verification page
        sessionStorage.setItem("pending_email", email);

        // Redirect to OTP page
        navigate("/verifyOtp");
      }
    } catch (err) {
      setError("Something went wrong, please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition mt-20">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">

        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600 dark:text-yellow-400">
          Create Account
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm text-center">
            {error}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 
                         bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 
                         focus:ring-blue-500 outline-none"
              placeholder="Enter your name"
            />
          </div>

          {/* Email */}
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
                         bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 
                         focus:ring-blue-500 outline-none"
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
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
                           bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 
                           focus:ring-blue-500 outline-none"
                placeholder="Create password"
              />

              {/* Eye Icon */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-600 dark:text-gray-300"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 
                       transition dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300 
                       cursor-pointer disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

        </form>

        <p className="text-center mt-4 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 dark:text-yellow-400 hover:underline">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}
