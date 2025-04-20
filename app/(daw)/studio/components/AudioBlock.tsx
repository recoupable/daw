/**
 * AudioBlock component that displays an audio region on the timeline
 * Styled to match professional DAW aesthetics
 */
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, X } from 'lucide-react';
import * as Tone from 'tone';

// Define constant for vertical lines with their own unique ids
const VERTICAL_LINES = [
  { id: 'beat-division-1', position: 1 },
  { id: 'beat-division-2', position: 2 },
  { id: 'beat-division-3', position: 3 },
  { id: 'beat-division-4', position: 4 },
];

interface AudioBlockProps {
  id: string;
  trackId: string;
  name: string;
  start: number;
  duration: number;
  audioUrl: string;
  isPlaying: boolean;
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent) => void;
  onPlay: () => void;
  onDelete?: () => void;
}

export function AudioBlock({
  id,
  name,
  style,
  isPlaying,
  audioUrl,
  onMouseDown,
  onPlay,
  onDelete,
}: AudioBlockProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);

  // Load and draw waveform data
  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;

    const loadWaveform = async () => {
      try {
        // Load audio buffer to extract waveform data
        const player = new Tone.Player({
          url: audioUrl,
          onload: () => {
            if (player.buffer) {
              // Get waveform data from the buffer
              const channelData = player.buffer.getChannelData(0);

              // Downsample the data to a manageable size
              const downsampledData = downsampleBuffer(channelData, 200);
              setWaveformData(downsampledData);

              // Draw the waveform
              drawWaveform(downsampledData);
            }
          },
        });
      } catch (error) {
        console.error('Error loading waveform:', error);
      }
    };

    loadWaveform();
  }, [audioUrl]);

  // Draw waveform when data changes
  useEffect(() => {
    if (waveformData) {
      drawWaveform(waveformData);
    }
  }, [waveformData]);

  // Function to downsample buffer data
  const downsampleBuffer = (
    buffer: Float32Array,
    targetLength: number,
  ): Float32Array => {
    const blockSize = Math.floor(buffer.length / targetLength);
    const result = new Float32Array(targetLength);

    for (let i = 0; i < targetLength; i++) {
      const start = i * blockSize;
      let sum = 0;
      let count = 0;

      for (let j = 0; j < blockSize; j++) {
        if (start + j < buffer.length) {
          sum += Math.abs(buffer[start + j]);
          count++;
        }
      }

      result[i] = count > 0 ? sum / count : 0;
    }

    return result;
  };

  // Function to draw waveform
  const drawWaveform = (data: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas size to match its display size
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Only update canvas dimensions if they don't match display size
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      console.log(`Resized canvas to ${displayWidth}x${displayHeight}`);
    }

    // Get canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Determine waveform color
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

    // Calculate center line
    const center = height / 2;

    // Draw waveform
    const barWidth = Math.max(1, width / data.length); // Ensure we use at least 1px width

    for (let i = 0; i < data.length; i++) {
      const x = Math.floor((i / data.length) * width);
      const amplitude = data[i] * (height * 0.7); // Scale amplitude to 70% of height
      ctx.fillRect(x, center - amplitude / 2, barWidth, amplitude);
    }
  };

  return (
    <div
      className="absolute group rounded-sm border border-primary/20 shadow-sm overflow-hidden"
      style={{
        ...style,
        background:
          'linear-gradient(to bottom, rgba(147, 51, 234, 0.5), rgba(126, 34, 206, 0.65))',
        height: '80%',
        top: '10%',
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with name */}
      <div className="px-2 py-1 text-xs font-medium text-white flex justify-between items-center bg-primary/20 backdrop-blur-sm">
        <span className="truncate">{name}</span>

        {/* Controls that appear on hover */}
        <div
          className={`flex gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <button
            type="button"
            className="p-0.5 rounded-sm hover:bg-white/20 transition-colors"
            onClick={onPlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3 text-white" />
            ) : (
              <Play className="h-3 w-3 text-white" />
            )}
          </button>

          {onDelete && (
            <button
              type="button"
              className="p-0.5 rounded-sm hover:bg-white/20 transition-colors"
              onClick={onDelete}
              title="Delete"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Waveform visualization */}
      <div className="w-full h-full min-h-[36px] flex items-center justify-center relative">
        {/* Add subtle vertical lines for timing reference */}
        <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
          {VERTICAL_LINES.map((line) => (
            <div key={line.id} className="h-full w-px bg-white/10 mx-auto" />
          ))}
        </div>

        <canvas
          ref={canvasRef}
          width={300}
          height={60}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
