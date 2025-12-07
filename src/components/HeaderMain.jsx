import { useState } from "react";
import { Menu, X, Ghost, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function HeaderMain({ currentUser, setCurrentUser }) {
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
        {/* Logo + Title */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2 animate-pulse">
            <Ghost className="text-orange-400 w-7 h-7" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-100">
              Watch<span className="text-orange-400">Out</span>
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 text-gray-300 font-medium">
            <Link to="/" className="hover:text-orange-400 transition-colors duration-200 animate-pulse">Home</Link>
            <Link to="/favorites" className="hover:text-orange-400 transition-colors duration-200 animate-pulse">Favorites</Link>
          </div>
          <div className="relative">
            <button onClick={() => setShowSettings(!showSettings)} className="animate-pulse text-gray-300 p-1 rounded hover:bg-neutral-700">
              <Settings />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 bg-neutral-800/90 border border-orange-400/30 rounded shadow p-2 z-50">
                <div className="px-2 py-1 text-gray-200 text-sm">{currentUser?.email}</div>
                <button onClick={logout} className="w-full mt-2 px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">Logout</button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-300" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-neutral-800 border-t border-orange-400/30 shadow-lg">
          <nav className="flex flex-col items-center py-3 space-y-3 text-gray-300 font-medium">
            <Link to="/" onClick={() => setIsOpen(false)} className="hover:text-orange-400 transition-colors animate-pulse">Home</Link>
            <Link to="/favorites" onClick={() => setIsOpen(false)} className="hover:text-orange-400 transition-colors animate-pulse">Favorites</Link>
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default HeaderMain;
