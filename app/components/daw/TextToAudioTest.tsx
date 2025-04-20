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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlayCircle, PauseCircle, AlertCircle } from 'lucide-react';

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export default function TextToAudioTest() {
  const [text, setText] = useState<string>(
    'This is a test of the Mureka AI text-to-speech system. It can generate realistic voices from text input.',
  );
  const [voiceType, setVoiceType] = useState<string>('neutral');
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    };
  }, []);

  // Update audio source when URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
    }
  }, [audioUrl]);

  const generateSpeech = async () => {
    try {
      setGenerationStatus('generating');
      setError(null);

      // Prepare request
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceType,
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
      setAudioUrl(data.audioUrl);
      setGenerationStatus('success');
    } catch (err) {
      console.error('Text-to-speech generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
      setGenerationStatus('error');
    }
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Text to Audio Test</CardTitle>
        <CardDescription>
          Test the Mureka API text-to-speech functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text-input">Text to convert to speech</Label>
          <Textarea
            id="text-input"
            placeholder="Enter text to convert to speech"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice-type">Voice Type</Label>
          <Select value={voiceType} onValueChange={setVoiceType}>
            <SelectTrigger id="voice-type">
              <SelectValue placeholder="Select voice type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="news">News Anchor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            onClick={generateSpeech}
            disabled={generationStatus === 'generating' || !text.trim()}
            className="w-full"
          >
            {generationStatus === 'generating' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Speech'
            )}
          </Button>

          {generationStatus === 'success' && audioUrl && (
            <Button
              onClick={togglePlayback}
              variant="outline"
              className="w-full flex justify-center items-center"
            >
              {isPlaying ? (
                <>
                  <PauseCircle className="mr-2 h-5 w-5" />
                  Pause Audio
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Play Audio
                </>
              )}
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {generationStatus === 'success' && (
          <div className="text-sm text-muted-foreground">
            <p>
              Audio generated successfully! Use the play button above to listen.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
