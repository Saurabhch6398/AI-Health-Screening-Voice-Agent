import React, { useEffect, useState } from "react";

interface VoiceVisualizerProps {
  isRecording: boolean;
  isSpeaking: boolean;
  visualizerData?: Uint8Array;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isRecording,
  isSpeaking,
  visualizerData,
}) => {
  const barCount = 16;
  const [syntheticHeights, setSyntheticHeights] = useState<number[]>(
    Array(barCount).fill(12)
  );

  useEffect(() => {
    if (!isSpeaking) {
      if (!isRecording) {
        setSyntheticHeights(Array(barCount).fill(12));
      }
      return;
    }

    const interval = setInterval(() => {
      setSyntheticHeights((prev) =>
        prev.map(() => Math.floor(Math.random() * 40) + 12)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isSpeaking, isRecording]);

  const getBarHeight = (index: number): number => {
    if (isRecording && visualizerData && visualizerData.length > 0) {
      const dataIndex = Math.floor((index / barCount) * visualizerData.length);
      const val = visualizerData[dataIndex] || 0;
      return Math.max(8, Math.min(56, Math.floor((val / 255) * 56)));
    }

    if (isSpeaking) {
      return syntheticHeights[index] || 12;
    }

    return 10;
  };

  const getBarColor = () => {
    if (isRecording) return "bg-rose-500 shadow-rose-500/50";
    if (isSpeaking) return "bg-teal-400 shadow-teal-400/50";
    return "bg-slate-700";
  };

  return (
    <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs mx-auto py-2">
      {Array.from({ length: barCount }).map((_, i) => {
        const height = getBarHeight(i);
        return (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-75 shadow-sm ${getBarColor()}`}
            style={{
              height: `${height}px`,
              opacity: isRecording || isSpeaking ? 0.9 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
};
