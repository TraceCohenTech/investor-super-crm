export default function Footer() {
  return (
    <footer className="mt-16 pt-6 border-t border-[#27272a]">
      <div className="flex items-center justify-center gap-3 text-xs text-[#a1a1aa]">
        <a
          href="https://x.com/Trace_Cohen"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          Twitter
        </a>
        <span className="text-[#3f3f46]">|</span>
        <a href="mailto:t@nyvp.com" className="hover:text-white transition-colors">
          t@nyvp.com
        </a>
      </div>
    </footer>
  );
}
