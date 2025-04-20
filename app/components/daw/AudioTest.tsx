'use client';

import React, { useState } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const AudioTest = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const [status, setStatus] = useState('Click to initialize audio');

  // Initialize audio context
  const initializeAudio = async () => {
    try {
      // Start the audio context
      await Tone.start();
      setAudioContextInitialized(true);
      setStatus('Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      setStatus('Error initializing audio');
    }
  };

  // Play a simple sound
  const playSound = async () => {
    if (!audioContextInitialized) {
      await initializeAudio();
    }

    try {
      // Simple synth
      const synth = new Tone.Synth().toDestination();

      // Play a note sequence
      if (!isPlaying) {
        setIsPlaying(true);
        setStatus('Playing sound');

        // Schedule a sequence of notes
        const now = Tone.now();
        synth.triggerAttackRelease('C4', '8n', now);
        synth.triggerAttackRelease('E4', '8n', now + 0.5);
        synth.triggerAttackRelease('G4', '8n', now + 1);
        synth.triggerAttackRelease('C5', '8n', now + 1.5);

        // Set a timeout to update state when done
        setTimeout(() => {
          setIsPlaying(false);
          setStatus('Playback complete');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
      setStatus('Error playing sound');
      setIsPlaying(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Audio Test</CardTitle>
        <CardDescription>Testing Tone.js and Web Audio API</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm bg-secondary p-2 rounded">
          Status: {status}
        </div>
        <Button onClick={playSound} disabled={isPlaying} className="w-full">
          {isPlaying ? 'Playing...' : 'Play Test Sound'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AudioTest;
