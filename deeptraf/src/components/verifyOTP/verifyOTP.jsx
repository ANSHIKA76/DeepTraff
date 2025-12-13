import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Matches what we saved in Signup.jsx
  const email = sessionStorage.getItem("pending_email");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:3000/auth/verifyOTP", {
        email,
        otp,
      });

      if (res.data.status === "success") {
        // Remove temp email
        sessionStorage.removeItem("pending_email");

        // Navigate to login
        navigate("/login");
      } else {
        setError("Invalid or expired OTP");
      }
    } catch (err) {
      setError("Invalid OTP");
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition mt-20">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">

        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600 dark:text-yellow-400">
          Verify OTP
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 text-center rounded mb-3 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleVerify} className="space-y-4">

          <div>
            <label className="block text-sm mb-1 dark:text-white">
              Enter OTP
            </label>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 
              bg-gray-50 dark:bg-gray-700 dark:text-white"
              placeholder="Enter the OTP sent to your email"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 
            dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300 cursor-pointer"
          >
            Verify OTP
          </button>

        </form>

      </div>
    </div>
  );
}
