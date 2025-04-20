'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Audio types for selection
const AUDIO_TYPES = [
  { name: 'Sine Wave', type: 'sine' as const },
  { name: 'White Noise', type: 'noise' as const },
];

export const WaveformTest = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);

  // Generate waveform data based on type
  const generateWaveformData = useCallback(
    (type: 'sine' | 'noise'): Float32Array => {
      const sampleRate = 44100;
      const duration = 2; // seconds
      const samples = sampleRate * duration;
      const data = new Float32Array(samples);

      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        if (type === 'sine') {
          // Simple sine wave at 440Hz (A4)
          data[i] = Math.sin(2 * Math.PI * 440 * t);
        } else {
          // White noise
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }
      }

      return data;
    },
    [],
  );

  // Draw the waveform on the canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas dimensions to match its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Get waveform data for the current type
    const currentType = AUDIO_TYPES[currentTypeIndex];
    const waveformData = generateWaveformData(currentType.type);

    // Set up drawing styles
    ctx.strokeStyle = 'violet';
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Sample the data to avoid drawing too many points
    const step = Math.max(1, Math.floor(waveformData.length / canvas.width));
    const verticalCenter = canvas.height / 2;
    const amplitudeFactor = currentType.type === 'sine' ? 0.9 : 0.5;

    for (let i = 0; i < canvas.width; i++) {
      const dataIndex = Math.min(i * step, waveformData.length - 1);
      const x = i;
      // Scale the amplitude for better visibility
      const y =
        verticalCenter -
        waveformData[dataIndex] * verticalCenter * amplitudeFactor;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [currentTypeIndex, generateWaveformData]);

  // Redraw waveform when type changes or component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        drawWaveform();
      } catch (err) {
        console.error('Error drawing waveform:', err);
        setError('Failed to draw waveform visualization');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentTypeIndex, drawWaveform]);

  // Redraw on window resize
  useEffect(() => {
    const handleResize = () => {
      drawWaveform();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [drawWaveform]);

  // Toggle play/pause using Tone.js
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
    } else {
      try {
        // Start the audio context if needed
        Tone.start();

        // Create the appropriate audio source
        const currentType = AUDIO_TYPES[currentTypeIndex];

        if (currentType.type === 'sine') {
          const synth = new Tone.Synth().toDestination();
          synth.volume.value = -20;
          synth.envelope.attack = 0.1;
          synth.envelope.decay = 0.2;
          synth.envelope.sustain = 0.5;
          synth.envelope.release = 0.8;
          synth.triggerAttackRelease('A4', '2n');
        } else {
          const noise = new Tone.Noise('white').toDestination();
          noise.volume.value = -30;
          noise.start().stop('+2');
        }

        setIsPlaying(true);

        // Auto-stop after 2 seconds
        setTimeout(() => {
          setIsPlaying(false);
        }, 2000);
      } catch (err) {
        console.error('Error playing audio:', err);
        setError('Failed to play audio');
      }
    }
  }, [isPlaying, currentTypeIndex]);

  // Switch audio type
  const switchAudioType = useCallback(() => {
    const nextIndex = (currentTypeIndex + 1) % AUDIO_TYPES.length;
    setCurrentTypeIndex(nextIndex);
  }, [currentTypeIndex]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Waveform Visualization Test</CardTitle>
        <CardDescription>
          Currently playing: {AUDIO_TYPES[currentTypeIndex].name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full rounded border border-border bg-white min-h-[100px] flex items-center justify-center relative">
          <canvas ref={canvasRef} className="w-full h-[100px]" />
          {isLoading && (
            <p className="absolute text-sm text-muted-foreground">
              Loading waveform...
            </p>
          )}
          {error && (
            <div className="absolute text-sm text-destructive p-4 text-center">
              <p>{error}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={togglePlayPause}
            disabled={!!error}
            className="flex-1"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button
            variant="outline"
            onClick={switchAudioType}
            className="flex-none"
          >
            Switch Audio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaveformTest;
