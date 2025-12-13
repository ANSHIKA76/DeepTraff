import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!email) {
      setError("Email missing. Please do Forgot Password again.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/auth/resetPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      console.log("resetPassword response:", data);

      if (res.ok && data.status === "success") {
        setMsg("Password reset successfully. You can login now.");
        // clear saved email
        sessionStorage.removeItem("resetEmail");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(data.detail || data.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-600 dark:text-yellow-400">
          Reset Password
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm text-center">
            {error}
          </p>
        )}

        {msg && (
          <p className="bg-green-100 text-green-700 p-2 rounded mb-3 text-sm text-center">
            {msg}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleReset}>
          <div>
            <label className="block text-sm mb-1 dark:text-white">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 
                bg-gray-200 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 dark:text-white">OTP</label>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 
                bg-gray-50 dark:bg-gray-700 dark:text-white"
              placeholder="Enter OTP sent to your email"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 dark:text-white">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 
                bg-gray-50 dark:bg-gray-700 dark:text-white"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 dark:text-white">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 
                bg-gray-50 dark:bg-gray-700 dark:text-white"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700
              dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
