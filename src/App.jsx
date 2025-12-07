import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import HeaderMain from "./components/HeaderMain";
import HeaderAuth from "./components/HeaderAuth";
import HeaderAdmin from "./components/HeaderAdmin";
import SearchBar from "./components/SearchBar";
import MovieList from "./components/MovieList";
import Footer from "./components/Footer";
import MovieDetails from "./pages/MovieDetails";
import Favorites from "./pages/Favorites";
import Filters from "./components/Filters";
import Banner from "./components/Banner";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import ReviewAnalysis from "./pages/ReviewAnalysis";
import AiChat from "./components/AiChat";

const API_KEY = "3cd475fb";

function App() {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("Avengers");
  const [filters, setFilters] = useState({
    genre: "",
    year: "",
    rating: "",
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch (e) {
      return null;
    }
  });

  const fetchMovies = async (query, filters = {}) => {
    let url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`;
    if (filters.year) url += `&y=${filters.year}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.Search) {
      setMovies(data.Search);
    } else {
      setMovies([]);
    }
  };

  useEffect(() => {
    fetchMovies("Avengers");
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchMovies(searchTerm, newFilters);
  };

  // Header selector based on current path (must be used inside Router)
  const HeaderSelector = () => {
    const location = useLocation();
    const path = location.pathname || "/";
    // admin header when admin
    if (currentUser && currentUser.isAdmin) return <HeaderAdmin currentUser={currentUser} setCurrentUser={setCurrentUser} />;
    // if not logged in show auth header (login/signup visible)
    if (!currentUser) return <HeaderAuth currentUser={currentUser} setCurrentUser={setCurrentUser} />;
    // otherwise main header for normal users
    return <HeaderMain currentUser={currentUser} setCurrentUser={setCurrentUser} />;
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-neutral-900 relative overflow-hidden">
        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: "linear-gradient(90deg, #1a1a1a, #2d0f0f)",
              color: "#fff",
              border: "1px solid #ff3b00",
              boxShadow: "0 0 15px rgba(255, 60, 0, 0.4)",
            },
            success: {
              icon: "🩸",
              style: {
                border: "1px solid #ff4d00",
                boxShadow: "0 0 20px rgba(255, 80, 0, 0.5)",
              },
            },
            error: {
              icon: "💀",
              style: {
                border: "1px solid #a10000",
                boxShadow: "0 0 20px rgba(255, 0, 0, 0.5)",
              },
            },
          }}
        />

        <HeaderSelector />
        <Routes>
          <Route
            path="/"
            element={
              <Landing
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={() => fetchMovies(searchTerm, filters)}
                filters={filters}
                onFilterChange={handleFilterChange}
                movies={movies}
              />
            }
          />

          <Route path="/movie/:id" element={<MovieDetails currentUser={currentUser} />} />
          <Route path="/favorites" element={<Favorites currentUser={currentUser} />} />
          <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />
          <Route path="/signup" element={<Signup setCurrentUser={setCurrentUser} />} />
          <Route path="/admin" element={<AdminDashboard currentUser={currentUser} />} />
          <Route path="/admin/reviews" element={<ReviewAnalysis currentUser={currentUser} />} />
        </Routes>
        <Footer />
        <AiChat currentUser={currentUser} />
      </div>
    </Router>
  );
}

export default App;
