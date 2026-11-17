import { atom } from "jotai";

import { ApiError, User } from "@/api/client";

export type SessionState =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; user: User };

/** Who is logged in. Set by `SessionGate`, read by any screen. */
export const sessionAtom = atom<SessionState>({ status: "loading" });

/** Vietnamese copy for an error, shown to the user. */
export function errorText(error: ApiError): string {
  switch (error.code) {
    case "network_error":
      return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
    case "unauthorized":
      return "Zalo không xác nhận được tài khoản của bạn.";
    case "zalo_sdk_error":
      return "Không lấy được thông tin đăng nhập từ Zalo.";
    case "config_error":
      return "Ứng dụng chưa được cấu hình địa chỉ máy chủ.";
    case "upstream_error":
      return "Zalo đang không phản hồi. Vui lòng thử lại sau.";
    default:
      return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new ApiError(0, "unknown_error", message);
}
