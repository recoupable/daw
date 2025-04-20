import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Mureka API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_MUREKA_API_URL || 'https://api.mureka.ai';

// Enable mock mode for testing without a real API key
const MOCK_MODE = true; // process.env.NEXT_PUBLIC_MOCK_TTS === 'true';

// Mock audio URL for testing
const MOCK_AUDIO_URL =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export async function POST(request: NextRequest) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_MUREKA_API_KEY;

    console.log('Using API URL:', API_BASE_URL);

    // If in mock mode or no API key, return mock response
    if (MOCK_MODE || !apiKey) {
      if (!MOCK_MODE && !apiKey) {
        console.warn('API key not configured, using mock mode');
      }

      // Parse the request body to log what would be sent
      const body = await request.json();
      console.log('MOCK: Would send to Mureka API:', body);

      // Return mock response after a short delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return NextResponse.json({
        id: `mock-${Date.now()}`,
        status: 'completed',
        audioUrl: MOCK_AUDIO_URL,
      });
    }

    // Parse the request body
    const body = await request.json();
    const { text, voiceType } = body;

    if (!text) {
      return NextResponse.json(
        { message: 'Text is required' },
        { status: 400 },
      );
    }

    // Prepare the request to Mureka API
    const murekaResponse = await fetch(`${API_BASE_URL}/v1/tts/create_speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_id: voiceType || 'neutral',
        output_format: 'mp3',
      }),
    });

    if (!murekaResponse.ok) {
      let errorMessage = 'Text-to-speech generation failed';
      console.error(
        `Mureka API error: ${murekaResponse.status} ${murekaResponse.statusText}`,
      );

      try {
        const errorData = await murekaResponse.json();
        console.error(
          'Mureka API error response:',
          JSON.stringify(errorData, null, 2),
        );
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        console.error('Error parsing Mureka API error response:', parseError);
        try {
          const textError = await murekaResponse.text();
          console.error('Raw error response:', textError);
        } catch (e) {
          console.error('Failed to read error response as text too');
        }
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: murekaResponse.status },
      );
    }

    // Parse response data
    const responseData = await murekaResponse.json();

    // Check if we need to poll for completion
    if (responseData.status === 'processing') {
      // In a real app, you might set up a polling mechanism or webhooks
      // For demo purposes, we'll just wait a bit and check once
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check status
      const statusResponse = await fetch(
        `${API_BASE_URL}/v1/tts/query_task/${responseData.id}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      if (!statusResponse.ok) {
        return NextResponse.json(
          { message: 'Failed to check generation status' },
          { status: statusResponse.status },
        );
      }

      const statusData = await statusResponse.json();
      if (statusData.status === 'completed') {
        return NextResponse.json({
          audioUrl: statusData.audioUrl,
          id: statusData.id,
        });
      } else {
        // Still processing
        return NextResponse.json(
          {
            message: 'Audio is still processing',
            id: responseData.id,
            status: statusData.status,
          },
          { status: 202 },
        );
      }
    } else if (responseData.status === 'completed') {
      // Already completed
      return NextResponse.json({
        audioUrl: responseData.audioUrl,
        id: responseData.id,
      });
    } else {
      // Error or other status
      return NextResponse.json(
        {
          message: `Unexpected status: ${responseData.status}`,
          id: responseData.id,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}
