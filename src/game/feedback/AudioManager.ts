import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { AppState, Platform } from "react-native";
import { createMusicPlayer, type MusicPlayer } from "./MusicPlayer";
import { defaultAudioSettings, soundIds, type AudioSettings, type SoundId } from "./feedbackTypes";
import { backgroundMusicSources, soundRegistry } from "./soundRegistry";
import { soundMix, type SoundLane } from "./soundMix";

class AudioManagerClass {
  private players = new Map<SoundId, AudioPlayer>();
  private musicPlayer?: MusicPlayer;
  private musicTrackIndex = Math.floor(Math.random() * backgroundMusicSources.length);
  private warnedMissing = new Set<SoundId>();
  private settings: AudioSettings = defaultAudioSettings;
  private audioModeReady?: Promise<void>;
  private lastPlayed = new Map<SoundId, number>();
  private laneRequests: Record<SoundLane, number> = { ui: 0, event: 0 };
  private active = new Map<SoundLane, { id: SoundId; until: number }>();

  connectLifecycle() {
    const resume = () => this.configureMusic();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") resume();
    });
    if (Platform.OS !== "web" || typeof document === "undefined") return () => subscription.remove();

    const onVisible = () => { if (document.visibilityState === "visible") resume(); };
    // These calls stay inside the gesture; no await before browser play().
    document.addEventListener("pointerup", resume);
    document.addEventListener("keydown", resume);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      subscription.remove();
      document.removeEventListener("pointerup", resume);
      document.removeEventListener("keydown", resume);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }

  configure(settings: AudioSettings) {
    this.settings = settings;
    for (const [id, player] of this.players) player.volume = settings.sfxVolume * soundMix[id].gain;
    if (!settings.soundEnabled || settings.sfxVolume <= 0) {
      // Cancel requests that are still awaiting audio-session setup or a seek.
      this.laneRequests.ui++;
      this.laneRequests.event++;
      this.active.clear();
      this.lastPlayed.clear();
      for (const player of this.players.values()) {
        player.pause();
      }
    }
    this.configureMusic();
  }

  preload() {
    if (!this.settings.soundEnabled) return;
    this.ensureAudioMode();
    for (const soundId of soundIds) this.getPlayer(soundId);
  }

  async play(soundId: SoundId) {
    if (!this.settings.soundEnabled || this.settings.sfxVolume <= 0) return;
    const mix = soundMix[soundId];
    const requestedAt = Date.now();
    if (requestedAt - (this.lastPlayed.get(soundId) ?? -Infinity) < mix.cooldownMs) return;
    const current = this.active.get(mix.lane);
    if (current && current.until > requestedAt && soundMix[current.id].priority > mix.priority) return;
    const player = this.getPlayer(soundId);
    if (!player) return;
    this.lastPlayed.set(soundId, requestedAt);
    const request = ++this.laneRequests[mix.lane];
    const isCurrent = () => this.settings.soundEnabled && this.settings.sfxVolume > 0
      && request === this.laneRequests[mix.lane] && Date.now() - requestedAt < 400;

    try {
      await this.ensureAudioMode();
      if (!isCurrent()) return;
      await player.seekTo(0);
      if (!isCurrent()) return;
      const previous = this.active.get(mix.lane);
      if (previous && previous.id !== soundId) this.players.get(previous.id)?.pause();
      player.volume = this.settings.sfxVolume * mix.gain;
      player.play();
      this.active.set(mix.lane, { id: soundId, until: Date.now() + mix.durationMs });
    } catch (error) {
      if (__DEV__) console.warn(`[ScaleLog audio] Could not play "${soundId}" on ${Platform.OS}.`, error);
    }
  }

  private getPlayer(soundId: SoundId) {
    const source = soundRegistry[soundId];
    if (!source) {
      if (__DEV__ && !this.warnedMissing.has(soundId)) {
        this.warnedMissing.add(soundId);
        console.warn(`[ScaleLog audio] Missing sound asset "${soundId}". Add it in src/game/feedback/soundRegistry.ts.`);
      }
      return undefined;
    }

    const existing = this.players.get(soundId);
    if (existing) return existing;

    try {
      const player = createAudioPlayer(source);
      player.volume = this.settings.sfxVolume * soundMix[soundId].gain;
      this.players.set(soundId, player);
      return player;
    } catch (error) {
      if (__DEV__) console.warn(`[ScaleLog audio] Could not load "${soundId}" on ${Platform.OS}.`, error);
      return undefined;
    }
  }

  private ensureAudioMode() {
    if (!this.audioModeReady) {
      this.audioModeReady = setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: "mixWithOthers",
        allowsRecording: false,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      }).catch((error) => {
        this.audioModeReady = undefined;
        if (__DEV__) console.warn("[ScaleLog audio] Could not configure the audio session.", error);
      });
    }
    return this.audioModeReady;
  }

  private configureMusic() {
    if (!this.settings.musicEnabled || this.settings.musicVolume <= 0) {
      this.musicPlayer?.pause();
      return;
    }

    try {
      if (!this.musicPlayer) {
        const player = createMusicPlayer(backgroundMusicSources[this.musicTrackIndex]);
        this.musicPlayer = player;
        player.onEnded(() => {
          if (!this.settings.musicEnabled || this.settings.musicVolume <= 0) return;
          this.musicTrackIndex = (this.musicTrackIndex + 1) % backgroundMusicSources.length;
          player.replace(backgroundMusicSources[this.musicTrackIndex]);
          this.startMusic(player);
        });
      }
      this.musicPlayer.volume = this.settings.musicVolume;
      if (!this.musicPlayer.playing) {
        const player = this.musicPlayer;
        if (Platform.OS === "web") this.startMusic(player);
        else void this.ensureAudioMode().then(() => this.startMusic(player));
      }
    } catch (error) {
      if (__DEV__) console.warn(`[ScaleLog audio] Could not configure background music on ${Platform.OS}.`, error);
    }
  }

  private startMusic(player: MusicPlayer) {
    if (!this.settings.musicEnabled || this.settings.musicVolume <= 0 || this.musicPlayer !== player || player.playing) return;
    player.volume = this.settings.musicVolume;
    try {
      void Promise.resolve(player.play()).catch((error) => this.reportMusicError(error));
    } catch (error) {
      this.reportMusicError(error);
    }
  }

  private reportMusicError(error: unknown) {
    if (__DEV__) console.warn("[ScaleLog audio] Music playback was interrupted or blocked; retrying on the next interaction.", error);
  }
}

export const AudioManager = new AudioManagerClass();
