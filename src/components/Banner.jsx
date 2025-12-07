import { useEffect, useRef, useState } from "react";

const API_KEY = "3ae4907c";

function Banner() {
  const sliderRef = useRef(null);
  const [movieImages, setMovieImages] = useState([]);

  useEffect(() => {
    const titles = [
      "The Exorcist", "The Shining", "Halloween",
      "A Nightmare on Elm Street", "The Conjuring", "Hereditary",
      "Get Out", "The Ring", "Insidious", "Sinister", "It", "Scream"
    ];

    const fetchPosters = async () => {
      const posters = [];
      for (const title of titles) {
        try {
          const res = await fetch(
            `https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(title)}`
          );
          const data = await res.json();
          if (data.Poster && data.Poster !== "N/A") posters.push(data.Poster);
        } catch (err) {
          console.error("Error fetching:", title, err);
        }
      }
      setMovieImages([...posters, ...posters]);
    };
    fetchPosters();
  }, []);

  // Auto-scroll horizontally
  useEffect(() => {
    if (!sliderRef.current || movieImages.length === 0) return;
    const slider = sliderRef.current;
    let scrollPos = 0;
    const speed = 0.7;
    let frame;
    const scroll = () => {
      scrollPos += speed;
      if (scrollPos >= slider.scrollWidth / 2) scrollPos = 0;
      slider.scrollLeft = scrollPos;
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [movieImages]);

  if (movieImages.length === 0)
    return (
      <div className="h-72 flex items-center justify-center bg-black">
        <p className="text-red-500 animate-pulse">Summoning posters from the abyss...</p>
      </div>
    );

  return (
    <div className="relative w-full overflow-hidden bg-linear-to-b from-black via-neutral-950 to-black py-10">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-linear(circle_at_center,rgba(255,100,0,0.08),transparent_70%)] blur-3xl"></div>

      {/* Floating icons (static, no keyframes) */}
      <div className="absolute top-10 left-8 text-4xl opacity-20 select-none">🕸️</div>
      <div className="absolute top-16 right-12 text-4xl opacity-15 select-none">🦇</div>
      <div className="absolute bottom-8 left-10 text-4xl opacity-15 select-none">🕯️</div>

      {/* Title */}
      <h2 className="relative z-10 text-center text-3xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-red-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-8 drop-shadow-[0_0_10px_rgba(255,60,0,0.5)]">
        Tonight’s Fright Feature
      </h2>

      {/* Scrolling carousel */}
      <div
        ref={sliderRef}
        className="flex overflow-x-scroll whitespace-nowrap scrollbar-hide px-4"
      >
        {movieImages.map((img, i) => (
          <div
            key={i}
            className="inline-block w-[200px] sm:w-60 md:w-[280px] lg:w-[320px] shrink-0 px-3 transform transition-all duration-500 hover:scale-110 hover:rotate-1"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,80,0,0.15)] hover:shadow-[0_0_30px_rgba(255,100,0,0.5)] border border-orange-700/30 group">
              <img
                src={img}
                alt={`Horror ${i}`}
                className="w-full h-64 sm:h-72 md:h-80 object-cover transition-all duration-300 group-hover:brightness-110 group-hover:contrast-125"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Glow edges */}
      <div className="absolute left-0 top-0 bottom-0 w-40 bg-linear-to-r from-black via-neutral-900 to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-40 bg-linear-to-l from-black via-neutral-900 to-transparent pointer-events-none"></div>
    </div>
  );
}

export default Banner;
