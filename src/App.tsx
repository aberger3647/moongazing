import { Home } from "./Home";
import { Outlet } from "react-router-dom";
import { NotFound } from "./NotFound";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./App.css";

const Layout = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-indigo-950 to-indigo-600 text-white">
      <Outlet />
    </div>
  );
};

import { useState } from "react";

function App() {
  const [location, setLocation] = useState<string | null>(null);

  const router = createBrowserRouter([
    {
      element: <Layout />, 
      errorElement: <NotFound />, 
      children: [
        {
          path: "/",
          element: <Home location={location} setLocation={setLocation} />, 
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
