import { BrowserRouter, Routes, Route } from "react-router-dom";

import UserMap from "./pages/UserMap";
import AdminPage from "./components/adminedge";
import AdminPanel from "./components/AdminPanel";

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden">

      <BrowserRouter>

        <Routes>

          {/* default user map */}
          <Route path="/" element={<UserMap />} />

          {/* admin edge editor */}
          <Route path="/admin" element={<AdminPage />} />

          {/* admin panel only */}
          <Route path="/panel" element={<AdminPanel />} />

        </Routes>

      </BrowserRouter>

    </div>
  );
}

export default App;