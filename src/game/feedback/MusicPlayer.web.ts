import { Asset } from "expo-asset";
import type { AudioSource } from "expo-audio";
import type { MusicPlayer } from "./MusicPlayer";

function sourceUri(source: AudioSource): string {
  if (typeof source === "string") return source;
  if (typeof source === "number") return Asset.fromModule(source).uri;
  if (source?.uri) return source.uri;
  if (source?.assetId != null) return Asset.fromModule(source.assetId).uri;
  throw new Error("Missing background music source");
}

export function createMusicPlayer(source: AudioSource): MusicPlayer {
  // Keep the browser-authorized element across tracks and expose play()'s
  // rejection instead of treating an autoplay attempt as successful playback.
  const media = new Audio(sourceUri(source));
  media.preload = "auto";
  return {
    get playing() { return !media.paused && !media.ended; },
    get volume() { return media.volume; },
    set volume(value) { media.volume = value; },
    play: () => media.play(),
    pause: () => media.pause(),
    replace: (next) => { media.src = sourceUri(next); },
    onEnded: (listener) => { media.addEventListener("ended", listener); },
  };
}
