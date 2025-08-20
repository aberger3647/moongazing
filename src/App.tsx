// import { useEffect, useState } from "react";
// import { createClient } from "@supabase/supabase-js";
import "./App.css";

// interface Place {
//   place_name: string;
// }

// const supabase = createClient(
//   "https://hzumejezhfscczjdrrcl.supabase.co",
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6dW1lamV6aGZzY2N6amRycmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4MTU1NDYsImV4cCI6MjA1NDM5MTU0Nn0.18IJFupGm1_oIb6gPFigtW_j63HS77ujs6UlE6vgVR4"
// );

// function App() {
//   const [places, setPlaces] = useState<Place[]>([]);

//   useEffect(() => {
//     getPlaces();
//   }, []);

//   async function getPlaces() {
//     const { data, error } = await supabase
//       .from("dark_sky_places")
//       .select("place_name");

//       if (error) {
//         console.error("Error fetching places: ", error);
//         return;
//       }

//       if (data) {
//         setPlaces(data);
//       }
//     console.log(data)
//   }
//   return (
//     <>
//       <ul>
//         {places.map((place: Place) => (
//           <li key={place.place_name}>{place.place_name}</li>
//         ))}
//       </ul>
//     </>
//   );
// }

// export default App;

import { Home } from "./Home";
import { Outlet } from "react-router-dom";
import { NotFound } from "./NotFound";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const Layout = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-indigo-950 to-indigo-600 text-white">
      <Outlet />
    </div>
  );
};

function App() {
  const router = createBrowserRouter([
    {
      element: <Layout />,
      errorElement: <NotFound />,
      children: [
        {
          path: "/",
          element: <Home />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
