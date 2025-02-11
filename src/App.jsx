import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
  "https://hzumejezhfscczjdrrcl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6dW1lamV6aGZzY2N6amRycmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4MTU1NDYsImV4cCI6MjA1NDM5MTU0Nn0.18IJFupGm1_oIb6gPFigtW_j63HS77ujs6UlE6vgVR4"
);

function App() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    getPlaces();
  }, []);

  async function getPlaces() {
    const { data } = await supabase
      .from("dark_sky_places")
      .select("place_name");
    setPlaces(data);
    console.log(data)
  }
  return (
    <>
      <ul>
        {places.map((place) => (
          <li key={place.place_name}>{place.place_name}</li>
        ))}
      </ul>
    </>
  );
}

export default App;
