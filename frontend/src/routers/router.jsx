import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import Profile from "../pages/user/Profile";
import Logout from "../pages/user/Logout";
import Header from "../components/layout/Header";  
import LiveStreams from "../pages/LiveStreams";
import AlertsDashboard from "../pages/AlertsDashboard";
import Analytics from "../pages/Analytics";
import Chatbot from "../pages/Chatbot";
import Settings from "../pages/Settings";
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <LiveStreams />
      },
      {
        path: "/home",
        element: <LiveStreams />
      },
      {
        path: "/livestreams",
        element: <LiveStreams />
      },
      {
        path: "/alertsdashboard",
        element: <AlertsDashboard />
      },
      {
        path: "/analytics",
        element: <Analytics />     
      },
      {
        path: "/chatbot",
        element: <Chatbot />
      },
      {
        path: "/settings",
        element: <Settings />
      },
         {
        path: "/logout",
        element: <Logout />
      },
    ]
  },
]);

export default router;