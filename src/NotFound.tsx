import { Link } from "react-router-dom";

export const NotFound = () => {
  return (
    <>
    <main>
      <h1>404 not found</h1>
      <Link to="/">Go Back Home</Link>
    </main>
    </>
  );
};
