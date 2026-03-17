import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing.tsx";
import { Room } from "./pages/Room.tsx";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}
