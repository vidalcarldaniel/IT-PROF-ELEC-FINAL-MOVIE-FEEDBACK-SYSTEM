import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

function MovieCard({ movie }) {
  const navigate = useNavigate();

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => navigate(`/movie/${movie.imdbID}`)}
    >
      {/* Hover background glow */}
      <div className="absolute inset-0 bg-orange-400/20 rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity"></div>

      {/* Card container */}
      <div className="relative bg-neutral-800/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-orange-400/30 shadow-lg hover:shadow-2xl hover:border-orange-400 transition-all active:scale-95 sm:hover:-translate-y-2 flex flex-col h-[420px] sm:h-[480px] md:h-[520px]">
        
        {/* Poster Section */}
        <div className="relative overflow-hidden shrink-0">
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
        <div className="p-3 sm:p-4 flex flex-col justify-between grow min-h-0">
          <div className="grow">
            <h2 className="font-bold text-base sm:text-lg text-gray-200 mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors leading-tight">
              {movie.Title}
            </h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
              <Calendar size={14} className="text-orange-400" />
              <span>{movie.Year}</span>
            </div>
          </div>

          {/* View Details - visible on mobile, hover on desktop */}
          <div className="mt-3 flex items-center gap-1 text-xs text-orange-400 font-semibold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <span>View Details</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;