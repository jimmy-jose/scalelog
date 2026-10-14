import { createAudioPlayer, type AudioSource } from "expo-audio";

export interface MusicPlayer {
  readonly playing: boolean;
  volume: number;
  play(): void | Promise<void>;
  pause(): void;
  replace(source: AudioSource): void;
  onEnded(listener: () => void): void;
}

export function createMusicPlayer(source: AudioSource): MusicPlayer {
  const player = createAudioPlayer(source, 250);
  player.loop = false;
  return {
    get playing() { return player.playing; },
    get volume() { return player.volume; },
    set volume(value) { player.volume = value; },
    play: () => player.play(),
    pause: () => player.pause(),
    replace: (next) => player.replace(next),
    onEnded: (listener) => {
      player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) listener();
      });
    },
  };
}
