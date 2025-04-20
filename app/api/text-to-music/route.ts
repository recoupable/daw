import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Mureka API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_MUREKA_API_URL || 'https://api.mureka.ai';

// ⚠️ EMERGENCY FIX: FORCE MOCK MODE OFF
const MOCK_MODE = false;

// Mock audio URL for testing
const MOCK_AUDIO_URL =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

export async function POST(request: NextRequest) {
  try {
    // Log the request details for debugging
    console.log('TEXT-TO-MUSIC API CALLED');
    console.log('Request URL:', request.url);
    console.log(
      'Request headers:',
      JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2),
    );

    // Get the API key from environment variables
    const apiKey =
      process.env.NEXT_PUBLIC_MUREKA_API_KEY || process.env.MUREKA_API_KEY;

    // ⚠️ EMERGENCY DIAGNOSTICS
    console.log('');
    console.log('🔍 MUREKA API KEY DIAGNOSTICS:');
    console.log('------------------------------');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Is Production?', process.env.NODE_ENV === 'production');
    console.log('API_KEY found?', !!apiKey);
    if (apiKey) {
      console.log(`API_KEY first 5 chars: ${apiKey.substring(0, 5)}...`);
      console.log('API_KEY length:', apiKey.length);
    } else {
      console.log('API_KEY: MISSING');
      console.log('⚠️⚠️⚠️ CRITICAL: CHECK ENVIRONMENT VARIABLES IN VERCEL ⚠️⚠️⚠️');
      // List all keys to help diagnose misspellings
      console.log('Available env vars that might be useful:');
      const envKeys = Object.keys(process.env)
        .filter(
          (key) =>
            key.includes('MUREKA') ||
            key.includes('API') ||
            key.includes('KEY') ||
            key.includes('URL'),
        )
        .join(', ');
      console.log(envKeys || 'None found');
    }
    console.log('Using API URL:', API_BASE_URL);
    console.log('------------------------------');
    console.log('');

    // Still using mock check but with better logging
    const usingMock = !apiKey;

    if (usingMock) {
      console.error('❌❌❌ API KEY MISSING - FORCING MOCK MODE ❌❌❌');
      console.error('This should never happen in production!');
      console.error('Check your environment variables in Vercel!');
      console.error('Environment variables needed:');
      console.error('1. NEXT_PUBLIC_MUREKA_API_KEY or');
      console.error('2. MUREKA_API_KEY');
    } else {
      console.log('✅ API Key found, making real request to Mureka API');
    }

    // Completely bypass mock mode if we have an API key
    if (usingMock) {
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
      // Add a random seed to ensure different results each time
      seed: Math.floor(Math.random() * 1000000).toString(),
      // Add a timestamp to prevent any caching on their side
      timestamp: Date.now(),
      // Increase temperature for more variety
      temperature: 0.9,
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
          // Add cache control headers
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
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
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    console.error('Text-to-music error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      {
        status: 500,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
        },
      },
    );
  }
}
