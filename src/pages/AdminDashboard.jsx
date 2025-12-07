import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Supabase from "../lib/supabase";

const OMDB_API = "3cd475fb";

export default function AdminDashboard({ currentUser }) {
  const navigate = useNavigate();

  // Guard: redirect non-admins
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'admin' && !currentUser.isAdmin)) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [byMovie, setByMovie] = useState([]);

  useEffect(() => {
    if (Supabase) {
      loadFromSupabase();
    } else {
      loadFromLocal();
    }
  }, []);

  async function loadFromSupabase() {
    try {
      // Users count (requires appropriate RLS or admin role)
      const { count: userCount, error: uErr } = await Supabase.from('users').select('id', { count: 'exact', head: true });
      if (uErr) console.warn('users count error', uErr);
      setTotalUsers(userCount || 0);

      // Fetch reviews (we'll compute counts & averages client-side)
      const { data: reviews, error: rErr } = await Supabase.from('reviews').select('id, movie_id, rating, hidden');
      if (rErr) console.warn('reviews fetch error', rErr);
      const rv = reviews || [];
      const visible = rv.filter((r) => !r.hidden);
      setTotalReviews(visible.length);
      const sum = visible.reduce((s, x) => s + (x.rating || 0), 0);
      setAvgRating(visible.length > 0 ? (sum / visible.length).toFixed(2) : 0);

      // Aggregate by movie
      const map = {};
      for (const r of visible) {
        if (!map[r.movie_id]) map[r.movie_id] = { movieId: r.movie_id, count: 0, sum: 0 };
        map[r.movie_id].count += 1;
        map[r.movie_id].sum += r.rating || 0;
      }
      const movieStats = Object.values(map);

      // Enrich with OMDB titles
      const enriched = await Promise.all(
        movieStats.map(async (m) => {
          try {
            const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API}&i=${m.movieId}`);
            const data = await res.json();
            return { ...m, title: data.Title || m.movieId };
          } catch (e) {
            return { ...m, title: m.movieId };
          }
        })
      );
      enriched.sort((a, b) => b.count - a.count);
      setByMovie(enriched);
    } catch (err) {
      console.error('Supabase load failed', err);
      loadFromLocal();
    }
  }

  function loadFromLocal() {
    // Users
    const users = JSON.parse(localStorage.getItem("users")) || [];
    setTotalUsers(users.length);

    // Reviews
    const movieReviews = JSON.parse(localStorage.getItem("movieReviews")) || {};
    let count = 0;
    let sum = 0;
    const movieStats = [];

    for (const movieId of Object.keys(movieReviews)) {
      const arr = movieReviews[movieId] || [];
      const visible = arr.filter((r) => !r.hidden);
      const c = visible.length;
      const s = visible.reduce((acc, r) => acc + (r.rating || 0), 0);
      count += c;
      sum += s;
      movieStats.push({ movieId, count: c, sum: s });
    }

    setTotalReviews(count);
    setAvgRating(count > 0 ? (sum / count).toFixed(2) : 0);

    // Enrich movieStats with titles (optional)
    const enrich = async () => {
      const enriched = await Promise.all(
        movieStats.map(async (m) => {
          try {
            const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API}&i=${m.movieId}`);
            const data = await res.json();
            return { ...m, title: data.Title || m.movieId };
          } catch (e) {
            return { ...m, title: m.movieId };
          }
        })
      );
      enriched.sort((a, b) => b.count - a.count);
      setByMovie(enriched);
    };

    enrich();
  }

  return (
    <div className="min-h-screen bg-neutral-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-orange-400">Admin Dashboard</h1>
          <Link to="/admin/reviews" className="bg-orange-400 text-neutral-900 px-3 py-2 rounded-lg">Review Analysis</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-neutral-800/70 rounded-xl border border-orange-400/20">
            <p className="text-sm text-gray-300">Total Registered Users</p>
            <p className="text-3xl font-semibold text-gray-100">{totalUsers}</p>
          </div>

          <div className="p-4 bg-neutral-800/70 rounded-xl border border-orange-400/20">
            <p className="text-sm text-gray-300">Total Reviews</p>
            <p className="text-3xl font-semibold text-gray-100">{totalReviews}</p>
          </div>

          <div className="p-4 bg-neutral-800/70 rounded-xl border border-orange-400/20">
            <p className="text-sm text-gray-300">Average Rating</p>
            <p className="text-3xl font-semibold text-gray-100">{avgRating}</p>
          </div>
        </div>

        <div className="mt-8 bg-neutral-800/60 p-4 rounded-xl border border-orange-400/20">
          <h2 className="text-lg font-semibold text-orange-400 mb-3">Top Reviewed Movies</h2>
          {byMovie.length === 0 && <p className="text-gray-400">No reviews yet.</p>}
          {byMovie.map((m) => (
            <div key={m.movieId} className="py-2 border-b border-neutral-700 last:border-b-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 font-semibold">{m.title}</p>
                  <p className="text-sm text-gray-400">{m.count} reviews</p>
                </div>
                <div className="text-gray-300">Avg: {m.count > 0 ? (m.sum / m.count).toFixed(2) : "N/A"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
