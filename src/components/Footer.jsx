function Footer() {
  return (
    <footer className="relative z-10 bg-neutral-800 border-t border-orange-400/30 mt-auto w-full">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base text-gray-300 font-medium">
          <span>© {new Date().getFullYear()} WatchOut</span>
          <span className="hidden sm:inline">|</span>
          <span>Carl Daniel N. Vidal</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;