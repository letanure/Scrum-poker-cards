import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Landing } from "./pages/Landing.tsx";
import { Room } from "./pages/Room.tsx";
import { About } from "./pages/About.tsx";
import { Privacy } from "./pages/Privacy.tsx";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
