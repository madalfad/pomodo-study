// Curated YouTube presets for the Sound Mixer.
//
// Edit this file to change the default videos or the list of preset options
// shown in the Music / Ambience dropdowns. The first entry of each array is
// used as the application's default — `SoundMixer.tsx` reads from
// `DEFAULT_MUSIC_URL` and `DEFAULT_AMBIENCE_URL` below.

export interface VideoPreset {
  /** Human-readable name shown in the dropdown. */
  label: string;
  /** Any standard YouTube URL — full, short (youtu.be), or /live/ form. */
  url: string;
}

export const MUSIC_PRESETS: VideoPreset[] = [
  {
    label: "Lofi Hip Hop Radio (Lofi Girl)",
    url: "https://youtu.be/JCKBaJDRMw4",
  },
  {
    label: "Synthwave Radio (Lofi Girl)",
    url: "https://youtu.be/4xDzrJKXOOY",
  },
  {
    label: "Jazz Radio – Relaxing Jazz",
    url: "https://youtu.be/Dx5qFachd3A",
  },
  {
    label: "Classical Music for Studying",
    url: "https://youtu.be/jgpJVI3tDbY",
  },
  {
    label: "Peaceful Piano",
    url: "https://youtu.be/4oStw0r33so",
  },
];

export const AMBIENCE_PRESETS: VideoPreset[] = [
  {
    label: "Forest birds & breeze",
    url: "https://youtu.be/0QKdqm5TX6c",
  },
  {
    label: "Rain on a window",
    url: "https://youtu.be/mPZkdNFkNps",
  },
  {
    label: "Crackling fireplace",
    url: "https://youtu.be/L_LUpnjgPso",
  },
  {
    label: "Coffee shop ambience",
    url: "https://youtu.be/h2zkV-l_TbY",
  },
  {
    label: "Thunderstorm",
    url: "https://youtu.be/nDq6TstdEi8",
  },
];

/** Default URLs used by `DEFAULT_SETTINGS` in `SoundMixer.tsx`. */
export const DEFAULT_MUSIC_URL = MUSIC_PRESETS[0].url;
export const DEFAULT_AMBIENCE_URL = AMBIENCE_PRESETS[0].url;

/**
 * Look up the preset that matches a given URL (case-insensitive, query strings
 * ignored). Returns `undefined` if the user is using a custom URL.
 */
export function findPreset(
  presets: VideoPreset[],
  url: string,
): VideoPreset | undefined {
  const normalize = (u: string) => u.split(/[?#]/)[0].toLowerCase();
  const target = normalize(url);
  return presets.find((p) => normalize(p.url) === target);
}
