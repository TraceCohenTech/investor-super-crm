"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-2xl p-8 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-[#a1a1aa] mb-6">
          {error.message || "An unexpected error occurred while loading this view."}
        </p>
        <button
          onClick={reset}
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
