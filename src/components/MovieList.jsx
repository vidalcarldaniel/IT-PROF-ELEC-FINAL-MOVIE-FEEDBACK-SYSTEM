import MovieCard from "./MovieCard";

function MovieList({ movies }) {
  if (movies.length === 0) {
    return (
      <div className="text-center py-8 sm:py-16 px-4">
        <div className="inline-block px-4 sm:px-8 py-3 sm:py-4 bg-neutral-800/60 backdrop-blur-sm rounded-full border border-orange-400/30 shadow-sm">
          <p className="text-sm sm:text-base text-gray-300 font-medium">
            No movies found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {movies.map((movie) => (
        <MovieCard key={movie.imdbID} movie={movie} />
      ))}
    </div>
  );
}

export default MovieList;