import { useState } from "react";
import { Menu, X, Ghost, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function HeaderAuth({ currentUser, setCurrentUser }) {
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
          {/* Desktop Auth Menu placed in right-side group to pin to far right */}
          <nav className="hidden md:flex gap-4 text-gray-300 font-medium items-center">
            <Link to="/login" className="hover:text-orange-400 transition-colors duration-200">Login</Link>
            <Link to="/signup" className="bg-orange-400 text-neutral-900 px-3 py-1 rounded-full font-semibold hover:bg-orange-500 transition-colors">Sign Up</Link>
          </nav>

          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                <button onClick={() => setShowSettings(!showSettings)} className="text-gray-300 p-1 rounded"><Settings /></button>
                {showSettings && (
                  <div className="absolute right-4 top-14 bg-neutral-800/90 border border-orange-400/30 rounded shadow p-2">
                    <div className="px-2 py-1 text-gray-200">{currentUser?.email}</div>
                    <button onClick={logout} className="w-full mt-2 px-3 py-1 text-sm text-white bg-red-600 rounded">Logout</button>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <button className="md:hidden text-gray-300" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-neutral-800 border-t border-orange-400/30 shadow-lg">
          <nav className="flex flex-col items-center py-3 space-y-3 text-gray-300 font-medium">
            <Link to="/login" onClick={() => setIsOpen(false)} className="hover:text-orange-400 transition-colors">Login</Link>
            <Link to="/signup" onClick={() => setIsOpen(false)} className="bg-orange-400 text-neutral-900 px-4 py-2 rounded-full font-semibold hover:bg-orange-500 transition-colors">Sign Up</Link>
            {currentUser && <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button>}
          </nav>
        </div>
      )}
    </header>
  );
}

export default HeaderAuth;
