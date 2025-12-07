import { useState } from "react";
import { Menu, X, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function HeaderAdmin({ currentUser, setCurrentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    navigate("/login");
  };

  return (
    <header className="w-full bg-neutral-800/70 backdrop-blur-lg shadow-md border-b border-orange-400/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex items-center gap-2 animate-pulse">
            <h1 className="text-xl md:text-2xl font-bold text-gray-100">
              Admin<span className="text-orange-400">Panel</span>
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 text-gray-300 font-medium">
            <Link to="/admin" className="hover:text-orange-400 animate-pulse">Dashboard</Link>
            <Link to="/admin/reviews" className="hover:text-orange-400 animate-pulse">Reviews</Link>
            <Link to="/" className="hover:text-orange-400 animate-pulse">Site</Link>
          </div>
          <div className="relative">
            <button onClick={() => setShowSettings(!showSettings)} className="text-gray-300 p-1 rounded hover:bg-neutral-700 animate-pulse">
              <Settings />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 bg-neutral-800/90 border border-orange-400/30 rounded shadow p-2 z-50">
                <button onClick={logout} className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">Logout</button>
              </div>
            )}
          </div>

          <button className="md:hidden text-gray-300" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-neutral-800 border-t border-orange-400/30 shadow-lg">
          <nav className="flex flex-col items-center py-3 space-y-3 text-gray-300 font-medium">
            <Link to="/admin" onClick={() => setIsOpen(false)} className="hover:text-orange-400">Dashboard</Link>
            <Link to="/admin/reviews" onClick={() => setIsOpen(false)} className="hover:text-orange-400">Reviews</Link>
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button>
          </nav>
        </div>
      )}
    </header>
  );
}
