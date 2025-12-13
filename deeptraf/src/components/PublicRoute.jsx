import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
  const token = sessionStorage.getItem("access_token");

  // If user is already logged in → redirect to Dashboard
  if (token) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
