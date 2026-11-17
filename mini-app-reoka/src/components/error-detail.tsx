import { ApiError } from "@/api/client";

/**
 * The raw error code and message, for debugging the first real Zalo logins.
 * Shown in dev, or in any build made with VITE_DEBUG=true.
 */
const ErrorDetail = ({ error }: { error: ApiError }) => {
  if (import.meta.env.PROD && import.meta.env.VITE_DEBUG !== "true") return null;
  return (
    <p className="break-all text-xs text-faint">
      {error.code}
      {error.status ? ` · HTTP ${error.status}` : ""} · {error.message}
    </p>
  );
};

export default ErrorDetail;
