import { Home } from "./Home";
import { Unsubscribe } from "./Unsubscribe";
import { ManageAlerts } from "./ManageAlerts";
import { Outlet } from "react-router-dom";
import { NotFound } from "./NotFound";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { StarsBackground, CloudsBackground } from "./components";

import "./App.css";

const Layout = ({ cloudcover }: { cloudcover: number | null }) => {
  return (
    <div className="relative min-h-screen w-full text-white">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-indigo-950 to-indigo-600" />
      <StarsBackground />
      <CloudsBackground cloudcover={cloudcover} />
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
};

import { useState } from "react";

function App() {
  const [location, setLocation] = useState<string | null>(null);
  const [cloudcover, setCloudcover] = useState<number | null>(null);

  const router = createBrowserRouter([
    {
      element: <Layout cloudcover={cloudcover} />,
      errorElement: <NotFound />,
      children: [
        {
          path: "/",
          element: (
            <Home
              location={location}
              setLocation={setLocation}
              setCloudcover={setCloudcover}
            />
          ),
        },
        {
          path: "/unsubscribe",
          element: <Unsubscribe />,
        },
        {
          path: "/manage-alerts",
          element: <ManageAlerts />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
