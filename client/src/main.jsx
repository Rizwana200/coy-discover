import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Intro from "./Intro.jsx";

function Root() {
  const [entered, setEntered] = useState(false);

  return (
    <>
      {/* App renders underneath so the feed is already loaded when the intro exits */}
      <App />
      {!entered && <Intro onEnter={() => setEntered(true)} />}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);