'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import {
  generateAudio,
  mockGenerateAudio,
  checkGenerationStatus,
} from '../../lib/mureka-api';
import type {
  GenerateAudioParams,
  AudioGenerationResponse,
} from '../../lib/mureka-api';
import { Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react';

export function AudioGenTest() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] =
    useState<AudioGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Check if API key is configured
  const isApiKeyConfigured =
    typeof window !== 'undefined' && !!localStorage.getItem('mureka_api_key');

  const handleGenerateAudio = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus(null);
    setError(null);

    try {
      const params: GenerateAudioParams = {
        prompt,
        duration: 10, // Generate 10 seconds of audio
        tempo: 120, // 120 BPM
      };

      // Use mock implementation if API key is not configured
      const response = isApiKeyConfigured
        ? await generateAudio(params)
        : await mockGenerateAudio(params);

      setGenerationStatus(response);

      // If the status is 'pending' or 'processing', poll for updates
      if (response.status === 'pending' || response.status === 'processing') {
        pollGenerationStatus(response.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const pollGenerationStatus = async (generationId: string) => {
    // Use a simple polling mechanism to check the status every 2 seconds
    const interval = setInterval(async () => {
      try {
        // Use the mock for testing if no API key
        let status: AudioGenerationResponse;

        if (isApiKeyConfigured) {
          status = await checkGenerationStatus(generationId);
        } else {
          // Simulate status updates for mock implementation
          await new Promise((resolve) => setTimeout(resolve, 1500));
          status = {
            id: generationId,
            status: 'completed',
            audioUrl: '/audio/mock-generated-audio.mp3',
          };
        }

        setGenerationStatus(status);

        // Stop polling if the generation is completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to check generation status',
        );
        clearInterval(interval);
      }
    }, 2000);
  };

  const handlePlayAudio = () => {
    if (!generationStatus?.audioUrl) return;

    if (audioElement) {
      // Toggle play/pause if we already have an audio element
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    } else {
      // Create a new audio element
      const audio = new Audio(generationStatus.audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('play', () => setIsPlaying(true));

      audio.play().catch((err) => {
        setError(`Failed to play audio: ${err.message}`);
      });

      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Audio Generation Test</CardTitle>
        <CardDescription>
          Test the MUREKA.ai API integration for generating audio from text
          prompts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Text Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Describe the audio you want to generate (e.g., 'Upbeat electronic track with synth leads and a driving beat')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />

          {!isApiKeyConfigured && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              No API key configured. Using mock implementation. Configure an API
              key in Settings.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        {generationStatus && (
          <div className="border rounded-lg p-4 bg-muted/40">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              {generationStatus.status === 'pending' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {generationStatus.status === 'processing' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {generationStatus.status === 'completed' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {generationStatus.status === 'failed' && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              Generation Status:{' '}
              {generationStatus.status.charAt(0).toUpperCase() +
                generationStatus.status.slice(1)}
            </h3>

            {generationStatus.estimatedTime && (
              <p className="text-sm text-muted-foreground">
                Estimated time remaining: {generationStatus.estimatedTime}{' '}
                seconds
              </p>
            )}

            {generationStatus.error && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                Error: {generationStatus.error}
              </p>
            )}

            {generationStatus.audioUrl && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handlePlayAudio}
                >
                  <Volume2 className="h-4 w-4" />
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <a
                  href={generationStatus.audioUrl}
                  download="generated-audio.mp3"
                  className="text-sm text-primary hover:underline"
                >
                  Download
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerateAudio}
          disabled={isGenerating || !prompt.trim()}
          className="ml-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Audio'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AudioGenTest;
