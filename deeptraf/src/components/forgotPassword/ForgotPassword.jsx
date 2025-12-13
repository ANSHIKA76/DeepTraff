import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3000/auth/forgotPassword", {
        email,
      });

      if (res.data.status === "otp_sent") {
        // ✅ Only save email; backend does NOT return otp
        sessionStorage.setItem("resetEmail", email);

        setMsg("OTP sent to your email.");
        // Go to reset password page where user enters OTP + new password
        navigate("/resetPassword");
      } else {
        setError(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Try again!");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition mt-20">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">

        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600 dark:text-yellow-400">
          Forgot Password
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 text-center rounded mb-3 text-sm">
            {error}
          </p>
        )}

        {msg && (
          <p className="bg-green-100 text-green-700 p-2 text-center rounded mb-3 text-sm">
            {msg}
          </p>
        )}

        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 dark:text-white">
              Enter Your Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 
              bg-gray-50 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 
            dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
