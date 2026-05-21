// Shared singleton loader for the YouTube IFrame API.
//
// Without this, every component that wants a YouTube player races to
// (a) inject the script tag and (b) install its own `window.onYouTubeIframeAPIReady`
// handler. Because that global is a single property, whichever component mounts
// last overwrites the others — and the losers only ever initialize if the API
// happens to already be loaded by the time their effect runs. That's the source
// of "sometimes one of the videos doesn't load until I refresh".
//
// This module:
//  * Caches a single Promise that resolves once `window.YT.Player` is available.
//  * Injects the script tag at most once.
//  * Chains the global ready-callback so it never gets clobbered, even if
//    something else on the page also installs one.

declare global {
  interface Window {
    YT?: { Player: any };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const SCRIPT_SRC = "https://www.youtube.com/iframe_api";

let apiPromise: Promise<NonNullable<Window["YT"]>> | null = null;

export function loadYouTubeIframeApi(): Promise<NonNullable<Window["YT"]>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube IFrame API requires a browser"));
  }

  // Already loaded — resolve synchronously on the microtask queue.
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }

  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    // Preserve any pre-existing callback installed by other code instead of
    // clobbering it.
    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === "function") {
        try {
          previousCallback();
        } catch (err) {
          console.error("Pre-existing onYouTubeIframeAPIReady threw:", err);
        }
      }
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube IFrame API loaded but window.YT is missing"));
      }
    };

    // If the script tag is already on the page (e.g. injected by another module
    // before this loader ran), just wait for the ready callback above.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) return;

    const tag = document.createElement("script");
    tag.src = SCRIPT_SRC;
    tag.async = true;
    tag.onerror = () => {
      apiPromise = null; // Allow a future retry
      reject(new Error("Failed to load YouTube IFrame API script"));
    };
    document.head.appendChild(tag);
  });

  return apiPromise;
}
