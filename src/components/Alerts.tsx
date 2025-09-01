export const Alerts = ({ location }: { location: string }) => {
  return (
    <>
      <h2 className="font-herculanum text-3xl mb-3">Email Alerts</h2>
      <div className="flex flex-col items-center space-y-4">
      <p className="text-center">Email me when moon-gazing conditions are optimal for {location}:</p>
      <form className="flex flex-col space-y-4 items-center">
        <input
          name="location"
          id="location"
          placeholder="hello@email.com"
          className="text-indigo-950 py-2 px-4 bg-indigo-100 rounded-xl"
        ></input>
        <button
          type="submit"
          className="font-herculanum text-xl bg-yellow-50 text-indigo-800 py-2 px-4 w-28 rounded-full"
        >
          Submit
        </button>
      </form>
      </div>
    </>
  );
};
