import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, X } from "lucide-react";
import toast from "react-hot-toast";
import Supabase from "../lib/supabase";

function Favorites({ currentUser }) {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !Supabase) {
      const stored = JSON.parse(localStorage.getItem("favorites")) || [];
      setFavorites(stored);
      return;
    }

    (async () => {
      try {
        // Try to load joined movie data if relationship exists
        const { data, error } = await Supabase.from('favorites')
          .select('movie_id, movies(*)')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Could not load favorites from Supabase', error.message);
          setFavorites([]);
          return;
        }

        const formatted = (data || []).map((row) => {
          if (row.movies && row.movies.length > 0) {
            const mv = row.movies[0];
            return {
              imdbID: row.movie_id,
              Title: mv.title || mv.name || "",
              Poster: mv.poster || mv.image || "",
              Year: mv.year || "",
            };
          }
          return { imdbID: row.movie_id, Title: "", Poster: "", Year: "" };
        });

        setFavorites(formatted);
      } catch (err) {
        console.error('Favorites load error', err);
        setFavorites([]);
      }
    })();
  }, [currentUser]);

  const handleUnfavorite = async (imdbID) => {
    // If no Supabase or no currentUser, fallback to localStorage
    if (!currentUser || !Supabase) {
      const updated = favorites.filter((movie) => movie.imdbID !== imdbID);
      setFavorites(updated);
      localStorage.setItem("favorites", JSON.stringify(updated));
      toast.error("Removed from Favorites 💔", {
        style: { background: "#1f1f1f", color: "#fff", border: "1px solid #fb923c" },
        icon: "💔",
      });
      return;
    }

    try {
      const { error } = await Supabase.from('favorites')
        .delete()
        .match({ user_id: currentUser.id, movie_id: imdbID });
      if (error) {
        console.warn('Could not remove favorite', error.message);
        toast.error('Could not remove favorite');
        return;
      }
      const updated = favorites.filter((movie) => movie.imdbID !== imdbID);
      setFavorites(updated);
      toast.error('Removed from Favorites 💔', {
        style: { background: '#1f1f1f', color: '#fff', border: '1px solid #fb923c' },
        icon: '💔',
      });
    } catch (err) {
      console.error('Unfavorite error', err);
      toast.error('An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 text-orange-400 opacity-10 text-5xl sm:text-7xl md:text-9xl">
          ✦
        </div>
        <div className="absolute top-20 sm:top-40 right-10 sm:right-20 text-orange-400 opacity-5 text-4xl sm:text-5xl md:text-7xl">
          ♡
        </div>
        <div className="absolute bottom-20 sm:bottom-32 left-1/4 text-orange-400 opacity-8 text-3xl sm:text-4xl md:text-6xl">
          ✧
        </div>
      </div>

      <div className="relative z-10 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-400 mb-4 sm:mb-6 md:mb-8 text-center">
          Your Favorites ❤️
        </h2>

        {favorites.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-16 px-4">
            <div className="inline-block px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-neutral-800/60 backdrop-blur-sm rounded-full border border-orange-400/30 shadow-sm">
              <p className="text-sm sm:text-base text-gray-300 font-medium">
                No favorites yet. Start adding some movies!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {favorites.map((movie) => (
              <div key={movie.imdbID} className="group relative cursor-pointer">
                {/* Unfavorite Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfavorite(movie.imdbID);
                  }}
                  className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-20 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shadow-lg transition-all active:scale-95 sm:hover:scale-110"
                  title="Remove from favorites"
                >
                  <X size={14} className="sm:w-4 sm:h-4" />
                </button>

                {/* Hover background glow */}
                <div className="absolute inset-0 bg-orange-400/20 rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity"></div>

                {/* Card container */}
                <div
                  onClick={() => navigate(`/movie/${movie.imdbID}`)}
                  className="relative bg-neutral-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-orange-400/30 shadow-lg hover:shadow-2xl hover:border-orange-400 transition-all active:scale-95 sm:hover:-translate-y-2 flex flex-col justify-between h-auto sm:h-112"
                >
                  {/* Poster Section */}
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        movie.Poster !== "N/A"
                          ? movie.Poster
                          : "https://via.placeholder.com/300x450/262626/fb923c?text=No+Image"
                      }
                      alt={movie.Title}
                      className="w-full h-64 sm:h-72 md:h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>

                  {/* Details Section */}
                  <div className="p-3 sm:p-4 flex flex-col justify-between grow">
                    <div>
                      <h2 className="font-bold text-sm sm:text-base md:text-lg text-gray-200 mb-1 sm:mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors leading-tight">
                        {movie.Title}
                      </h2>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400">
                        <Calendar
                          size={12}
                          className="text-orange-400 sm:w-3.5 sm:h-3.5"
                        />
                        <span>{movie.Year}</span>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-3 flex items-center gap-1 text-xs text-orange-400 font-semibold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <span>View Details</span>
                      <span className="group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
