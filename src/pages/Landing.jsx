import Banner from "../components/Banner";
import SearchBar from "../components/SearchBar";
import Filters from "../components/Filters";
import MovieList from "../components/MovieList";

export default function Landing({ searchTerm, setSearchTerm, onSearch, filters, onFilterChange, movies }) {
  return (
    <div className="relative z-10 flex-1">
      <div className="relative">
        <Banner />
        <div className="absolute top-50 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-lg">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={onSearch} />
        </div>
      </div>
      <div className="mt-6 px-4">
        <Filters filters={filters} onFilterChange={onFilterChange} />
        <MovieList movies={movies} />
      </div>
    </div>
  );
}
