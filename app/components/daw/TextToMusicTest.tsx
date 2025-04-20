'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  Music,
  Download,
} from 'lucide-react';

type GenerationStatus = 'idle' | 'generating' | 'polling' | 'success' | 'error';

export default function TextToMusicTest() {
  const [prompt, setPrompt] = useState<string>(
    'Upbeat electronic dance music with synth leads and energetic drums',
  );
  const [genre, setGenre] = useState<string>('electronic');
  const [duration, setDuration] = useState<string>('30');
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus>('idle');
  const [taskId, setTaskId] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [pollingCount, setPollingCount] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Create audio element when component mounts
    audioRef.current = new Audio();

    // Handle audio events
    const handleAudioEnded = () => setIsPlaying(false);
    audioRef.current.addEventListener('ended', handleAudioEnded);

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }

      // Clear any polling intervals
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Update audio source when URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
    }
  }, [audioUrl]);

  const generateMusic = async () => {
    try {
      setGenerationStatus('generating');
      setError(null);
      setAudioUrl(null);
      setTaskId('');

      // Prepare request
      const response = await fetch(`/api/text-to-music?_=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        body: JSON.stringify({
          model: 'mureka-6',
          prompt: prompt,
          // Add a timestamp to ensure randomness
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Generation API response:', data);

      if (data.status === 'completed' && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        setGenerationStatus('success');
      } else if (data.id) {
        // Log task ID
        console.log(`Received task ID: ${data.id}`);
        // Start polling for task completion
        setTaskId(data.id);
        setGenerationStatus('polling');
        startPolling(data.id);
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (err) {
      console.error('Music generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate music');
      setGenerationStatus('error');
    }
  };

  const startPolling = (id: string) => {
    setPollingCount(0);

    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Track retries for individual status checks
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;

    // Start polling
    pollingRef.current = setInterval(async () => {
      try {
        setPollingCount((prev) => prev + 1);

        console.log(
          `Polling for status (count ${pollingCount}), task ID: ${id}`,
        );

        // Only perform 30 polling attempts then give up
        if (pollingCount >= 30) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          throw new Error('Generation timed out after 30 attempts');
        }

        // Check status
        const statusUrl = `/api/text-to-music/status?id=${encodeURIComponent(id)}&_=${Date.now()}`;
        console.log(`Status check URL: ${statusUrl}`);

        const response = await fetch(statusUrl, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });

        console.log(
          `Status response: ${response.status} ${response.statusText}`,
        );

        if (!response.ok) {
          // Log additional error info
          const errorText = await response
            .text()
            .catch(() => "Couldn't read error response");
          console.error(
            `Status check failed: ${response.status}, Error: ${errorText}`,
          );

          // Count consecutive errors
          consecutiveErrors++;

          // If we've hit too many consecutive errors, throw an error
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            throw new Error(`Failed to check status: ${response.status}`);
          }

          // Otherwise, continue polling
          console.log(
            `Continuing to poll after error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`,
          );
          return;
        }

        // Reset consecutive errors on success
        consecutiveErrors = 0;

        const data = await response.json();

        console.log('Status check response data:', data);

        // Handle successful status from Mureka API
        if (data.status === 'succeeded' || data.status === 'completed') {
          // Success! Get the audio URL
          let audioUrl = null;

          // Check for choices array (from Mureka API)
          if (data.choices && data.choices.length > 0) {
            audioUrl = data.choices[0].url || data.choices[0].flac_url;
          }
          // If URL is directly in response
          else if (data.url) {
            audioUrl = data.url;
          }
          // Fallback if audioUrl is directly in response
          else if (data.audioUrl) {
            audioUrl = data.audioUrl;
          }

          if (audioUrl) {
            // Clear polling interval
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }

            console.log('Music generation completed! Audio URL:', audioUrl);
            setAudioUrl(audioUrl);
            setGenerationStatus('success');
          } else {
            console.error('Missing audio URL in successful response:', data);
            throw new Error(
              'Music generated but no audio URL found in response',
            );
          }
        } else if (data.status === 'failed') {
          // Error
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          throw new Error(data.error || 'Generation failed');
        }
        // Otherwise, continue polling
      } catch (err) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        console.error('Polling error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed while checking generation status',
        );
        setGenerationStatus('error');
      }
    }, 5000); // Poll every 5 seconds instead of 10
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Playback error:', err);
        setError('Failed to play audio');
      });
      setIsPlaying(true);
    }
  };

  const downloadMusic = () => {
    if (!audioUrl) return;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `music-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Text to Music Test</CardTitle>
        <CardDescription>
          Generate instrumental music from text descriptions using the Mureka
          API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt-input">Music Description</Label>
          <Textarea
            id="prompt-input"
            placeholder="Describe the type of music you want to generate"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger id="genre">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="pop">Pop</SelectItem>
                <SelectItem value="classical">Classical</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="ambient">Ambient</SelectItem>
                <SelectItem value="hiphop">Hip Hop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min="10"
              max="180"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            onClick={generateMusic}
            disabled={
              generationStatus === 'generating' ||
              generationStatus === 'polling' ||
              !prompt.trim()
            }
            className="w-full"
          >
            {generationStatus === 'generating' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing Generation...
              </>
            ) : generationStatus === 'polling' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Music... ({pollingCount})
              </>
            ) : (
              <>
                <Music className="mr-2 h-4 w-4" />
                Generate Music
              </>
            )}
          </Button>

          {generationStatus === 'success' && audioUrl && (
            <div className="flex gap-2">
              <Button
                onClick={togglePlayback}
                variant="outline"
                className="flex-1 flex justify-center items-center"
              >
                {isPlaying ? (
                  <>
                    <PauseCircle className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Play
                  </>
                )}
              </Button>

              <Button
                onClick={downloadMusic}
                variant="outline"
                className="flex items-center"
              >
                <Download className="mr-2 h-5 w-5" />
                Download
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {generationStatus === 'polling' && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-4 py-3 rounded">
            <p>
              Generating music can take several minutes. Please be patient while
              the AI creates your track.
            </p>
          </div>
        )}

        {generationStatus === 'success' && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 px-4 py-3 rounded">
            <p>
              Music generated successfully! Use the play button above to listen
              or download your track.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
