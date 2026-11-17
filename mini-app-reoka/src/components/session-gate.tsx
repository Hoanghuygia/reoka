import { useAtom } from "jotai";
import { ReactNode, useCallback, useEffect } from "react";
import { Button, Page, Spinner } from "zmp-ui";

import { login } from "@/api/client";
import ErrorDetail from "@/components/error-detail";
import { errorText, sessionAtom, toApiError } from "@/state/session";

/** Logs in through Zalo on start, and renders its children only once logged in. */
const SessionGate = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useAtom(sessionAtom);

  const start = useCallback(() => {
    setSession({ status: "loading" });
    login()
      .then(({ user }) => setSession({ status: "ready", user }))
      .catch((error) => setSession({ status: "error", error: toApiError(error) }));
  }, [setSession]);

  useEffect(start, [start]);

  if (session.status === "ready") return <>{children}</>;

  return (
    <Page className="flex flex-col items-center justify-center gap-4 px-6 text-center">
      {session.status === "loading" ? (
        <>
          <Spinner />
          <p className="text-muted">Đang đăng nhập…</p>
        </>
      ) : (
        <>
          <p className="text-[22px] font-semibold leading-tight">Chưa đăng nhập được</p>
          <p className="text-muted">{errorText(session.error)}</p>
          <ErrorDetail error={session.error} />
          <Button onClick={start}>Thử lại</Button>
        </>
      )}
    </Page>
  );
};

export default SessionGate;
