import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function TrailerModal({ open, onClose, query, videoId }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // If we have a specific YouTube video id (from TMDB or other API), embed it directly.
  // Otherwise fall back to a YouTube search-playlist embed using the query.
  const src = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
        query
      )}&autoplay=1&rel=0&modestbranding=1`;

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        // Close when clicking outside the modal content
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl bg-neutral-900 rounded-2xl overflow-hidden border border-orange-400/30 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-800/60">
          <div className="text-orange-400 font-semibold">Trailer</div>
          <button onClick={onClose} className="text-gray-300">
            <X />
          </button>
        </div>

        <div className="w-full h-[56vh] md:h-[70vh] bg-black">
          <iframe
            title="trailer-player"
            src={src}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
