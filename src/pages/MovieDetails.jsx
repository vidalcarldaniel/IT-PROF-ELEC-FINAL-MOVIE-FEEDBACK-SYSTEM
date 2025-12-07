import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Film,
  Users,
  Play,
  Star,
  Heart,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import toast from "react-hot-toast";
import TrailerModal from "../components/TrailerModal";
import Supabase from "../lib/supabase";
import { analyzeSentiment } from "../lib/ai";

// Simple heuristic sentiment check (fallback)
function simpleSentiment(text) {
  if (!text) return "neutral";
  const neg = ["bad", "terrible", "awful", "hate", "worst", "boring", "disappoint"];
  const low = text.toLowerCase();
  for (const w of neg) if (low.includes(w)) return "negative";
  return "positive";
}

const API_KEY = "3ae4907c";

function MovieDetails({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [related, setRelated] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [trailerVideoId, setTrailerVideoId] = useState(null);
  const [trailerQuery, setTrailerQuery] = useState(null);
  const [computedSentiment, setComputedSentiment] = useState(null);
  const [analyzingReview, setAnalyzingReview] = useState(false);

  // Fetch Movie Details
  useEffect(() => {
    const fetchMovie = async () => {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=full`
      );
      const data = await response.json();
      setMovie(data);
    };
    fetchMovie();
  }, [id]);

  // Load reviews from Supabase (all user reviews for this movie) — fallback to localStorage
  useEffect(() => {
    const loadAllReviews = async () => {
      // Try Supabase first
      if (Supabase) {
        try {
          const { data: dbReviews, error } = await Supabase.from('reviews')
            .select('id, user_id, rating, comment, sentiment, created_at')
            .eq('movie_id', id)
            .order('created_at', { ascending: false });

          if (error) {
            console.warn('Could not fetch reviews from Supabase:', error.message);
            // Fall back to localStorage
            const storedReviews = JSON.parse(localStorage.getItem("movieReviews")) || {};
            setReviews(storedReviews[id] || []);
            return;
          }

          // Map Supabase reviews to local format
          const mappedReviews = (dbReviews || []).map((r) => ({
            id: r.id,
            rating: r.rating,
            userEmail: r.user_id || "anonymous",
            text: r.comment,
            date: new Date(r.created_at).toLocaleString(),
            sentiment: r.sentiment,
          }));

          setReviews(mappedReviews);
        } catch (err) {
          console.error('Error loading reviews from Supabase:', err);
          // Fall back to localStorage
          const storedReviews = JSON.parse(localStorage.getItem("movieReviews")) || {};
          setReviews(storedReviews[id] || []);
        }
      } else {
        // No Supabase, use localStorage
        const storedReviews = JSON.parse(localStorage.getItem("movieReviews")) || {};
        setReviews(storedReviews[id] || []);
      }
    };

    loadAllReviews();
  }, [id]);

  // Real-time sentiment analysis as user types (debounced)
  useEffect(() => {
    if (!review.trim()) {
      setComputedSentiment(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAnalyzingReview(true);
      try {
        // Check if we're in cooldown
        const cooldownUntil = localStorage.getItem('aiCooldownUntil');
        if (cooldownUntil && Date.now() < parseInt(cooldownUntil, 10)) {
          // Use heuristic during cooldown
          setComputedSentiment(simpleSentiment(review));
          setAnalyzingReview(false);
          return;
        }

        // Try AI sentiment
        const s = await analyzeSentiment(review);
        setComputedSentiment(s || simpleSentiment(review));
      } catch (err) {
        console.warn('Real-time sentiment analysis failed, using heuristic', err);
        setComputedSentiment(simpleSentiment(review));
      } finally {
        setAnalyzingReview(false);
      }
    }, 800); // debounce 800ms

    return () => clearTimeout(timer);
  }, [review]);

  // Check if movie is in favorites (Supabase) — fallback to localStorage
  useEffect(() => {
    if (!movie) return;
    if (!currentUser || !Supabase) {
      const stored = JSON.parse(localStorage.getItem("favorites")) || [];
      const isInFavorites = stored.some((m) => m.imdbID === movie.imdbID);
      setIsFavorite(isInFavorites);
      return;
    }

    (async () => {
      try {
        const { data, error } = await Supabase.from('favorites')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('movie_id', movie.imdbID)
          .limit(1);
        if (error) {
          console.warn('Favorite check failed', error.message);
          setIsFavorite(false);
          return;
        }
        setIsFavorite(Array.isArray(data) && data.length > 0);
      } catch (err) {
        console.error('Error checking favorite', err);
        setIsFavorite(false);
      }
    })();
  }, [movie, currentUser]);

  // Fetch related movies based on genre
  useEffect(() => {
    if (!movie || !movie.Genre) return;
    const fetchRelated = async () => {
      const firstGenre = movie.Genre.split(",")[0].trim();
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
          firstGenre
        )}`
      );
      const data = await response.json();
      if (data.Search) {
        const filtered = data.Search.filter((m) => m.imdbID !== id);
        setRelated(filtered);
      } else {
        setRelated([]);
      }
    };
    fetchRelated();
  }, [movie, id]);

  const toggleFavorite = async () => {
    if (!currentUser) {
      toast.error("Please sign up or login to save favorites.");
      navigate('/signup');
      return;
    }

    // If Supabase client not configured, fallback to localStorage
    if (!Supabase) {
      const stored = JSON.parse(localStorage.getItem("favorites")) || [];
      if (isFavorite) {
        const updated = stored.filter((m) => m.imdbID !== movie.imdbID);
        localStorage.setItem("favorites", JSON.stringify(updated));
        setIsFavorite(false);
        toast.error("Removed from Favorites 💔", { style: { background: "#1f1f1f", color: "#fff" } });
      } else {
        stored.push(movie);
        localStorage.setItem("favorites", JSON.stringify(stored));
        setIsFavorite(true);
        toast.success("Added to Favorites ❤️", { style: { background: "#1f1f1f", color: "#fff" } });
      }
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await Supabase.from('favorites')
          .delete()
          .match({ user_id: currentUser.id, movie_id: movie.imdbID });
        if (error) {
          console.warn('Could not remove favorite', error.message);
          toast.error('Could not remove favorite');
          return;
        }
        setIsFavorite(false);
        toast.error('Removed from Favorites 💔', { style: { background: '#1f1f1f', color: '#fff' } });
      } else {
        // upsert movie record (if you have a movies table)
        try {
          await Supabase.from('movies').upsert([
            { movie_id: movie.imdbID, title: movie.Title, poster: movie.Poster }
          ], { onConflict: 'movie_id' });
        } catch (err) {
          console.warn('Movie upsert warning', err);
        }

        const { error } = await Supabase.from('favorites').insert([
          { user_id: currentUser.id, movie_id: movie.imdbID }
        ]);
        if (error) {
          console.warn('Could not add favorite', error.message);
          toast.error('Could not add favorite');
          return;
        }
        setIsFavorite(true);
        toast.success('Added to Favorites ❤️', { style: { background: '#1f1f1f', color: '#fff' } });
      }
    } catch (err) {
      console.error('Favorite toggle error', err);
      toast.error('An error occurred');
    }
  };

  // Submit review
  const handleReviewSubmit = async () => {
    if (!currentUser) {
      toast.error("Please sign up or login to submit a review.");
      navigate("/signup");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating first ⭐");
      return;
    }
    if (review.trim() === "") {
      toast.error("Please write a short review 💬");
      return;
    }


    // If Supabase is available, use it; otherwise fallback to localStorage
    if (Supabase) {
      try {
        // Use the pre-computed sentiment from real-time analysis
        const sentiment = computedSentiment || simpleSentiment(review);

        const { data, error } = await Supabase.from('reviews').insert([
          {
            movie_id: id,
            user_id: currentUser.id,
            rating,
            comment: review,
            sentiment,
          }
        ]).select().single();

        if (error) {
          console.warn('Could not insert review:', error.message);
          toast.error('Could not submit review');
          return;
        }

        // Reload all reviews from Supabase to show the new review and any others
        const { data: allReviews, error: fetchError } = await Supabase.from('reviews')
          .select('id, user_id, rating, comment, sentiment, created_at')
          .eq('movie_id', id)
          .order('created_at', { ascending: false });

        if (!fetchError && allReviews) {
          const mappedReviews = allReviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            userEmail: r.user_id || "anonymous",
            text: r.comment,
            date: new Date(r.created_at).toLocaleString(),
            sentiment: r.sentiment,
          }));
          setReviews(mappedReviews);
        }

        setRating(0);
        setReview("");
        setComputedSentiment(null);
        toast.success(`Review submitted successfully! (${sentiment}) 🎉`, {
          style: { background: "#1f1f1f", color: "#fff" },
        });
      } catch (err) {
        console.error('Review submit error', err);
        toast.error('An error occurred');
      }
      return;
    }

    // Fallback: localStorage
    const newReview = {
      id: Date.now(),
      rating,
      userEmail: currentUser?.email || "anonymous",
      text: review,
      date: new Date().toLocaleString(),
    };

    const storedReviews = JSON.parse(localStorage.getItem("movieReviews")) || {};
    const updated = {
      ...storedReviews,
      [id]: [...(storedReviews[id] || []), newReview],
    };

    localStorage.setItem("movieReviews", JSON.stringify(updated));
    setReviews(updated[id]);
    setRating(0);
    setReview("");
    toast.success("Review submitted successfully! 🎉", {
      style: { background: "#1f1f1f", color: "#fff" },
    });
  };

  if (!movie) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-900 px-4">
        <div className="text-center">
          <div className="inline-block px-6 py-4 bg-neutral-800/60 backdrop-blur-sm rounded-full border border-orange-400/30 shadow-sm animate-pulse">
            <p className="text-base text-orange-400 font-medium">
              ✧ Loading movie details... ✧
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-orange-400 opacity-10 text-9xl">
          ✦
        </div>
        <div className="absolute top-40 right-20 text-orange-400 opacity-5 text-7xl">
          ♡
        </div>
        <div className="absolute bottom-32 left-1/4 text-orange-400 opacity-8 text-6xl">
          ✧
        </div>
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-6 py-3 bg-neutral-800/80 backdrop-blur-xl text-orange-400 rounded-full hover:bg-neutral-700 transition-all active:scale-95 shadow-md border-2 border-orange-400/30 flex items-center gap-2 font-medium text-base"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        {/* Movie Details Card */}
        <div className="relative">
          <div className="absolute -inset-4 bg-orange-400/10 rounded-3xl blur-2xl"></div>
          <div className="relative bg-neutral-800/70 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border-2 border-orange-400/30">
            <div className="flex flex-col md:flex-row gap-8 p-8">
              {/* Poster */}
              <div className="w-full md:w-1/3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-orange-400/20 rounded-2xl blur-xl"></div>
                  <img
                    src={
                      movie.Poster !== "N/A"
                        ? movie.Poster
                        : "https://via.placeholder.com/400x600/262626/fb923c?text=No+Poster"
                    }
                    alt={movie.Title}
                    className="relative w-full rounded-2xl shadow-xl border-4 border-neutral-700"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-4xl font-bold text-orange-400 mb-3 leading-tight">
                    {movie.Title}
                  </h2>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-700/50 rounded-full border border-orange-400/30">
                    <Star
                      className="text-yellow-500"
                      size={16}
                      fill="currentColor"
                    />
                    <span className="text-base text-gray-300 font-semibold">
                      {movie.imdbRating || "N/A"} / 10
                    </span>
                  </div>
                </div>

                {/* Info Blocks */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-neutral-700/30 rounded-2xl border border-orange-400/20">
                    <Film className="text-orange-400 mt-1 shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-gray-400">
                        Genre
                      </p>
                      <p className="text-base text-gray-200">{movie.Genre}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-neutral-700/30 rounded-2xl border border-orange-400/20">
                    <Calendar
                      className="text-orange-400 mt-1 shrink-0"
                      size={20}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-400">
                        Released
                      </p>
                      <p className="text-base text-gray-200">
                        {movie.Released}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-neutral-700/30 rounded-2xl border border-orange-400/20">
                    <Users className="text-orange-400 mt-1 shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-gray-400">
                        Director
                      </p>
                      <p className="text-base text-gray-200">
                        {movie.Director}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-700/30 rounded-2xl border border-orange-400/20">
                    <p className="text-sm font-semibold text-gray-400 mb-2">
                      Cast
                    </p>
                    <p className="text-base text-gray-200">{movie.Actors}</p>
                  </div>
                </div>

                {/* Plot */}
                <div className="p-6 bg-neutral-700/40 rounded-2xl border border-orange-400/30">
                  <p className="text-sm font-semibold text-gray-400 mb-2">
                    ✧ Plot
                  </p>
                  <p className="text-base text-gray-200 leading-relaxed">
                    {movie.Plot}
                  </p>
                </div>

                {/* Trailer Button */}
                <button
                  onClick={async () => {
                    if (!currentUser) {
                      toast.error("Please sign up or login to watch trailers.");
                      navigate("/signup");
                      return;
                    }
                    // Try to fetch trailer via TMDB if API key is provided, otherwise fallback.
                    const tmdbKey = import.meta.env.VITE_TMDB_API_KEY;
                    setTrailerVideoId(null);
                    setTrailerQuery(null);
                    if (tmdbKey) {
                      try {
                        // 1) search movie by title
                        const searchRes = await fetch(
                          `https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(
                            movie.Title
                          )}`
                        );
                        const searchData = await searchRes.json();
                        if (searchData.results && searchData.results.length > 0) {
                          const tmdbId = searchData.results[0].id;
                          const videosRes = await fetch(
                            `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${tmdbKey}`
                          );
                          const videosData = await videosRes.json();
                          if (videosData.results && videosData.results.length > 0) {
                            // prefer official YouTube trailers
                            const found = videosData.results.find(
                              (v) =>
                                (v.type === "Trailer" || v.type === "Teaser") &&
                                v.site === "YouTube"
                            );
                            if (found) {
                              setTrailerVideoId(found.key);
                              setIsTrailerOpen(true);
                              return;
                            }
                          }
                        }
                      } catch (err) {
                        console.error("TMDB trailer fetch failed:", err);
                      }
                    }

                    // Fallback: open modal with search-based embed
                    setTrailerQuery(movie.Title + " trailer");
                    setIsTrailerOpen(true);
                  }}
                  className="w-full px-6 py-4 bg-orange-400 text-neutral-900 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl active:scale-95 hover:bg-orange-500 flex items-center justify-center gap-3 transition-all"
                >
                  <Play size={20} fill="currentColor" />
                  <span>Watch Trailer</span>
                </button>

                {/* Favorites Button */}
                <button
                  onClick={toggleFavorite}
                  className={`w-full px-6 py-4 rounded-2xl text-base font-semibold transition-all flex items-center justify-center gap-3 ${
                    isFavorite
                      ? "bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl active:scale-95"
                      : "bg-neutral-800 text-orange-400 border border-orange-400/50 hover:bg-neutral-700 active:scale-95"
                  }`}
                >
                  <Heart
                    size={20}
                    fill={isFavorite ? "white" : "none"}
                    className={isFavorite ? "text-white" : "text-orange-400"}
                  />
                  <span>
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ✧ User Review Section ✧ */}
        <div className="mt-12 bg-neutral-800/70 border border-orange-400/30 rounded-2xl p-8 shadow-xl">
          <h3 className="text-xl font-semibold text-orange-400 mb-4">
            Leave a Review ✧
          </h3>

          {/* Rating Stars */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <Star
                key={num}
                size={28}
                onMouseEnter={() => setHoverRating(num)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(num)}
                className={`cursor-pointer transition-colors ${
                  num <= (hoverRating || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-500"
                }`}
              />
            ))}
          </div>

          {/* Review Input */}
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your thoughts about this movie..."
            className="w-full p-4 bg-neutral-900 text-gray-200 rounded-xl border border-orange-400/20 focus:outline-none focus:border-orange-400/50 resize-none mb-4"
            rows="4"
          />

          <button
            onClick={handleReviewSubmit}
            className="w-full px-6 py-3 bg-orange-400 text-neutral-900 rounded-xl font-semibold hover:bg-orange-500 active:scale-95 transition-all"
          >
            Submit Review
          </button>

          {/* Display Submitted Reviews */}
          {reviews.length > 0 && (
            <div className="mt-8 space-y-4">
              <h4 className="text-lg font-semibold text-orange-400">
                User Reviews
              </h4>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-neutral-900/80 p-4 rounded-xl border border-orange-400/20"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-200">{r.text}</p>
                  <p className="text-xs text-gray-500 mt-2">{r.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Movies Section */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-orange-400 mb-4 px-1">
            Related Movies ✧
          </h3>

          {related.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView={2}
              breakpoints={{
                640: { slidesPerView: 3 },
                1024: { slidesPerView: 5 },
              }}
              navigation
              pagination={{ clickable: true }}
              className="pb-10"
            >
              {related.map((m) => (
                <SwiperSlide key={m.imdbID}>
                  <div
                    onClick={() => navigate(`/movie/${m.imdbID}`)}
                    className="bg-neutral-800/60 border border-orange-400/30 rounded-xl hover:scale-105 transition-all cursor-pointer overflow-hidden"
                  >
                    <img
                      src={
                        m.Poster !== "N/A"
                          ? m.Poster
                          : "https://via.placeholder.com/300x450/262626/fb923c?text=No+Poster"
                      }
                      alt={m.Title}
                      className="w-full h-[300px] object-cover"
                    />
                    <div className="p-3 text-center">
                      <h4 className="text-base font-semibold text-orange-400 truncate">
                        {m.Title}
                      </h4>
                      <p className="text-sm text-gray-400">{m.Year}</p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <p className="text-base text-gray-400 text-center py-4">
              No related movies found.
            </p>
          )}
        </div>
      </div>
      <TrailerModal
        open={isTrailerOpen}
        onClose={() => {
          setIsTrailerOpen(false);
          setTrailerVideoId(null);
          setTrailerQuery(null);
        }}
        query={trailerQuery || movie.Title + " trailer"}
        videoId={trailerVideoId}
      />
    </div>
  );
}

export default MovieDetails;
