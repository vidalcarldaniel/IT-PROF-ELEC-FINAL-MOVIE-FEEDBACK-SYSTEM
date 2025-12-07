import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Supabase from "../lib/supabase";
const OMDB_API = "3cd475fb";

// Simple heuristic sentiment check (fallback)
function simpleSentiment(text) {
  if (!text) return "neutral";
  const neg = ["bad", "terrible", "awful", "hate", "worst", "boring", "disappoint"];
  const low = text.toLowerCase();
  for (const w of neg) if (low.includes(w)) return "negative";
  return "positive";
}

export default function ReviewAnalysis({ currentUser }) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Guard: redirect non-admins
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && !currentUser.isAdmin)) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      // Try to fetch from Supabase first
      if (Supabase) {
        const { data: dbReviews, error } = await Supabase.from('reviews')
          .select('id, movie_id, rating, comment, sentiment, created_at, user_id')
          .eq('sentiment', 'negative')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Could not fetch reviews from Supabase:', error.message);
          loadFromLocal();
          return;
        }

        const flat = [];
        for (const r of dbReviews || []) {
          // Fetch movie title
          let title = r.movie_id;
          try {
            const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API}&i=${r.movie_id}`);
            const data = await res.json();
            if (data && data.Title) title = data.Title;
          } catch (e) {
            // ignore
          }

          flat.push({
            id: r.id,
            movieId: r.movie_id,
            title,
            text: r.comment,
            rating: r.rating,
            date: new Date(r.created_at).toLocaleString(),
            sentiment: r.sentiment || null,
          });
        }

        // We only load reviews that were already labeled 'negative' at submission time.
        setReviews(flat);
        setLoading(false);
        return;
      }

      loadFromLocal();
    } catch (err) {
      console.error('Load reviews error', err);
      loadFromLocal();
    }
  }

  async function loadFromLocal() {
    const movieReviews = JSON.parse(localStorage.getItem("movieReviews")) || {};
    const flat = [];
    for (const movieId of Object.keys(movieReviews)) {
      const arr = movieReviews[movieId] || [];
      let title = movieId;
      try {
        const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API}&i=${movieId}`);
        const data = await res.json();
        if (data && data.Title) title = data.Title;
      } catch (e) {
        // ignore
      }

      for (const r of arr) {
        flat.push({ ...r, movieId, title, sentiment: r.sentiment || null });
      }
    }

    // Analyze sentiment
    for (const f of flat) {
      if (!f.sentiment) f.sentiment = simpleSentiment(f.text);
    }

    // Filter to show only negative reviews
    const negativeReviews = flat.filter((f) => f.sentiment === 'negative');
    setReviews(negativeReviews);
    setLoading(false);
  }

  const deleteReview = async (reviewId) => {
    if (Supabase) {
      try {
        const { error } = await Supabase.from('reviews').delete().eq('id', reviewId);
        if (error) {
          console.warn('Could not delete review:', error.message);
          return;
        }
        loadReviews();
      } catch (err) {
        console.error('Delete error', err);
      }
    } else {
      // localStorage fallback
      const movieReviews = JSON.parse(localStorage.getItem("movieReviews")) || {};
      for (const movieId of Object.keys(movieReviews)) {
        movieReviews[movieId] = movieReviews[movieId].filter((r) => r.id !== reviewId);
      }
      localStorage.setItem("movieReviews", JSON.stringify(movieReviews));
      loadReviews();
    }
  };

  const hideReview = async (reviewId) => {
    if (Supabase) {
      try {
        const { error } = await Supabase.from('reviews').update({ hidden: true }).eq('id', reviewId);
        if (error) {
          console.warn('Could not hide review:', error.message);
          return;
        }
        loadReviews();
      } catch (err) {
        console.error('Hide error', err);
      }
    } else {
      // localStorage fallback
      const movieReviews = JSON.parse(localStorage.getItem("movieReviews")) || {};
      for (const movieId of Object.keys(movieReviews)) {
        movieReviews[movieId] = movieReviews[movieId].map((r) =>
          r.id === reviewId ? { ...r, hidden: true } : r
        );
      }
      localStorage.setItem("movieReviews", JSON.stringify(movieReviews));
      loadReviews();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-orange-400 mb-4">Review Analysis (Negative Reviews Only)</h1>
        <p className="text-sm text-gray-400 mb-6">This page shows only negative reviews using AI sentiment analysis.</p>

        {loading && <p className="text-gray-400">Loading reviews...</p>}
        {/* cooldown banner removed — analysis happens at submission time now */}
        {!loading && reviews.length === 0 && <p className="text-gray-400">No negative reviews found.</p>}

        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-xl border border-red-500 bg-neutral-800/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-gray-100 font-semibold">{r.title} <span className="text-sm text-gray-400">({r.movieId})</span></p>
                  <p className="text-sm text-gray-300 mt-1">{r.text}</p>
                  <p className="text-xs text-gray-500 mt-2">Rating: {r.rating} — {r.date}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm text-red-400 font-semibold">Negative</div>
                  <div className="flex gap-2">
                    <button onClick={() => hideReview(r.id)} className="px-3 py-1 bg-yellow-500 text-black rounded">Hide</button>
                    <button onClick={() => deleteReview(r.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
