import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";

import SessionGate from "@/components/session-gate";
import HomePage from "@/pages/index";

const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>
        {/* SessionGate renders a zmp-ui Page, which needs the router context. */}
        <ZMPRouter>
          <SessionGate>
            <AnimationRoutes>
              <Route path="/" element={<HomePage />}></Route>
            </AnimationRoutes>
          </SessionGate>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
};
export default Layout;
