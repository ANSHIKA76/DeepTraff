import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  // This wrapper ensures DataInput and AnalyzeReport stay stable.
  return (
    <div className="protected-wrapper">
      <Outlet />
    </div>
  );
}
