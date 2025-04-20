import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Mureka API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_MUREKA_API_URL || 'https://api.mureka.ai';

// Enable mock mode for testing without a real API key
const MOCK_MODE = false; // Real API integration only, no mock mode

// Mock audio URL for testing
const MOCK_AUDIO_URL =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

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

      // Simulate delay for realistic experience
      const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
      await new Promise((resolve) => setTimeout(resolve, delay));

      // For demo purposes, either return completed or task ID
      const mockCompleted = Math.random() > 0.5;

      if (mockCompleted) {
        // Immediately completed
        return NextResponse.json({
          id: `mock-${Date.now()}`,
          status: 'completed',
          audioUrl: MOCK_AUDIO_URL,
        });
      } else {
        // Return task ID for polling
        return NextResponse.json({
          id: `mock-${Date.now()}`,
          status: 'preparing',
          message: 'Music generation started',
        });
      }
    }

    // Parse the request body
    const body = await request.json();
    const { prompt, genre } = body;

    if (!prompt) {
      return NextResponse.json(
        { message: 'Prompt is required' },
        { status: 400 },
      );
    }

    // Prepare the request to Mureka API
    const requestBody = {
      model: 'mureka-6',
      prompt: prompt,
    };

    console.log('Sending to Mureka API:', {
      url: `${API_BASE_URL}/v1/instrumental/generate`,
      body: requestBody,
    });

    const murekaResponse = await fetch(
      `${API_BASE_URL}/v1/instrumental/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!murekaResponse.ok) {
      let errorMessage = 'Music generation failed';
      console.error(
        `Mureka API error: ${murekaResponse.status} ${murekaResponse.statusText}`,
      );

      // Attempt to get raw response first
      try {
        const rawResponse = await murekaResponse.text();
        console.error('Raw Mureka API error response:', rawResponse);

        // Try to parse as JSON if possible
        try {
          const errorData = JSON.parse(rawResponse);
          console.error('Parsed Mureka API error response:', errorData);

          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (jsonError) {
          console.error('Response is not valid JSON');
        }
      } catch (textError) {
        console.error('Failed to read error response as text', textError);
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: murekaResponse.status },
      );
    }

    // Parse response data
    const responseData = await murekaResponse.json();

    // Add detailed logging to debug task ID and API response
    console.log('--------------------------------------------');
    console.log('MUREKA API RESPONSE (FULL DETAILS)');
    console.log('Status:', murekaResponse.status, murekaResponse.statusText);
    console.log('Full Response Body:', JSON.stringify(responseData, null, 2));
    console.log(
      'Headers:',
      JSON.stringify(
        Object.fromEntries([...murekaResponse.headers.entries()]),
        null,
        2,
      ),
    );

    // Extract task ID directly from the response
    const taskId = responseData.id;
    if (taskId) {
      console.log('TASK ID:', taskId);
      console.log('TASK ID TYPE:', typeof taskId);

      // For debugging, try different formats
      console.log('Different query formats to try:');
      console.log(`- ${API_BASE_URL}/v1/instrumental/query_task?id=${taskId}`);
      console.log(`- ${API_BASE_URL}/v1/instrumental/query_task/${taskId}`);
      console.log(`- ${API_BASE_URL}/v1/song/query_task?id=${taskId}`);
      console.log(`- ${API_BASE_URL}/v1/query_task?id=${taskId}`);
    } else {
      console.log('WARNING: No task ID found in response');
    }
    console.log('--------------------------------------------');

    // Return the task data
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Text-to-music error:', error);
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
