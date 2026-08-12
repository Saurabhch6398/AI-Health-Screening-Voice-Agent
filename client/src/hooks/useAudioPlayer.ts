import { useState, useEffect, useRef, useCallback } from "react";

export function useAudioPlayer(
  latestAudio: string | null,
  latestText?: string | null,
  onPlaybackEnd?: () => void
) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onPlaybackEndRef = useRef(onPlaybackEnd);
  const lastSpokenTextRef = useRef<string | null>(null);
  const lastPlayedAudioRef = useRef<string | null>(null);

  useEffect(() => {
    onPlaybackEndRef.current = onPlaybackEnd;
  }, [onPlaybackEnd]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      if ("onvoiceschanged" in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!latestAudio) {
      lastPlayedAudioRef.current = null;
      return;
    }
    if (latestAudio === lastPlayedAudioRef.current) return;
    lastPlayedAudioRef.current = latestAudio;

    stopPlayback();

    try {
      const audio = new Audio(latestAudio);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setAudioError(null);
      };

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
        onPlaybackEndRef.current?.();
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
        setAudioError("Audio playback failed.");
        audioRef.current = null;
        onPlaybackEndRef.current?.();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay blocked:", err);
          setIsPlaying(false);
          onPlaybackEndRef.current?.();
        });
      }
    } catch (err: any) {
      console.error("Failed to play audio:", err);
      setIsPlaying(false);
      onPlaybackEndRef.current?.();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [latestAudio, stopPlayback]);

  // Fallback to Web Speech API if no base64 audio is provided
  useEffect(() => {
    if (latestAudio) return;
    if (!latestText || latestText.trim().length === 0) {
      lastSpokenTextRef.current = null;
      return;
    }

    if (latestText === lastSpokenTextRef.current) return;
    lastSpokenTextRef.current = latestText;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      const utterance = new SpeechSynthesisUtterance(latestText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const isHindi = /[\u0900-\u097F]/.test(latestText);
      utterance.lang = isHindi ? "hi-IN" : "en-US";

      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices && availableVoices.length > 0) {
        if (isHindi) {
          const hindiVoice = availableVoices.find(
            (v) =>
              v.lang.toLowerCase().startsWith("hi") ||
              v.lang.toLowerCase().includes("hi-in") ||
              v.name.toLowerCase().includes("hindi")
          );
          if (hindiVoice) {
            utterance.voice = hindiVoice;
          }
        } else {
          const englishVoice = availableVoices.find(
            (v) =>
              v.lang.toLowerCase().startsWith("en") &&
              (v.name.includes("Natural") ||
                v.name.includes("Google") ||
                v.name.includes("Samantha") ||
                v.name.includes("Alex"))
          );
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
        }
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setAudioError(null);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        onPlaybackEndRef.current?.();
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("SpeechSynthesis error:", e);
        }
        setIsPlaying(false);
        onPlaybackEndRef.current?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("SpeechSynthesis failed:", err);
      setIsPlaying(false);
      onPlaybackEndRef.current?.();
    }
  }, [latestAudio, latestText]);

  return {
    isPlaying,
    audioError,
    stopPlayback,
  };
}
