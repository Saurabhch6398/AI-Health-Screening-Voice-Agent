import { useState, useRef, useCallback } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [visualizerData, setVisualizerData] = useState<Uint8Array>(new Uint8Array(32));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  const hasSpokenRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onSilenceDetectedRef = useRef<(() => void) | undefined>(undefined);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(
    async (onSilenceDetected?: () => void): Promise<boolean> => {
      try {
        setPermissionDenied(false);
        hasSpokenRef.current = false;
        onSilenceDetectedRef.current = onSilenceDetected;
        clearSilenceTimer();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
        } catch (e) {
          console.warn("AudioContext setup failed:", e);
        }

        let mimeType = "audio/webm";
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        }

        mimeTypeRef.current = mimeType;

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(100);
        setIsRecording(true);

        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

          const loop = () => {
            if (analyserRef.current && mediaRecorderRef.current?.state === "recording") {
              analyserRef.current.getByteFrequencyData(dataArray);
              setVisualizerData(new Uint8Array(dataArray));

              let voicePeak = 0;
              for (let i = 0; i < 16 && i < dataArray.length; i++) {
                if (dataArray[i] > voicePeak) {
                  voicePeak = dataArray[i];
                }
              }

              if (voicePeak > 18) {
                if (!hasSpokenRef.current) {
                  hasSpokenRef.current = true;
                }
                if (silenceTimerRef.current) {
                  clearTimeout(silenceTimerRef.current);
                  silenceTimerRef.current = null;
                }
              } else if (hasSpokenRef.current && voicePeak < 15) {
                if (!silenceTimerRef.current && onSilenceDetectedRef.current) {
                  silenceTimerRef.current = setTimeout(() => {
                    if (mediaRecorderRef.current?.state === "recording") {
                      onSilenceDetectedRef.current?.();
                    }
                  }, 1500);
                }
              }

              animationFrameRef.current = requestAnimationFrame(loop);
            }
          };

          loop();
        }

        return true;
      } catch (err: any) {
        console.error("Microphone access error:", err);
        setPermissionDenied(true);
        setIsRecording(false);
        return false;
      }
    },
    [clearSilenceTimer]
  );

  const stopRecording = useCallback((): Promise<{ blob: Blob; mimeType: string } | null> => {
    clearSilenceTimer();
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        setIsRecording(false);
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        setIsRecording(false);
        setVisualizerData(new Uint8Array(32));

        resolve({ blob: audioBlob, mimeType: mimeTypeRef.current });
      };

      mediaRecorder.stop();
    });
  }, [clearSilenceTimer]);

  const cancelRecording = useCallback(() => {
    clearSilenceTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsRecording(false);
    audioChunksRef.current = [];
    setVisualizerData(new Uint8Array(32));
  }, [clearSilenceTimer]);

  return {
    isRecording,
    permissionDenied,
    visualizerData,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
