export const Alerts = ({ location }: { location: string }) => {
  return (
    <>
      <h2>Email Alerts</h2>
      <p>Email me when moon-gazing conditions are optimal for {location}</p>
      <form>
        <input placeholder="hello@email.com"></input>
        <button type="submit">Submit</button>
      </form>
    </>
  );
};
