import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Mureka API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_MUREKA_API_URL || 'https://api.mureka.ai';

// Enable mock mode for testing without a real API key
const MOCK_MODE = false; // Set to false to use the real Mureka API

// Mock audio URL for testing
const MOCK_AUDIO_URL =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3';

export async function GET(request: NextRequest) {
  try {
    // Get the task ID from the query parameter
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Task ID is required' },
        { status: 400 },
      );
    }

    // If in mock mode, return mock response
    if (MOCK_MODE || id.startsWith('mock-')) {
      // For demo purposes, simulate different states based on time
      const taskCreationTime =
        Number.parseInt(id.replace('mock-', ''), 10) || Date.now();
      const elapsedSeconds = (Date.now() - taskCreationTime) / 1000;

      // Simulate real-time progress
      if (elapsedSeconds < 10) {
        return NextResponse.json({
          id,
          status: 'preparing',
          message: 'Preparing to generate music...',
        });
      } else if (elapsedSeconds < 20) {
        return NextResponse.json({
          id,
          status: 'processing',
          message: 'Processing your request...',
          progress: Math.min(0.5, (elapsedSeconds - 10) / 20),
        });
      } else {
        // After 20 seconds, return completed
        return NextResponse.json({
          id,
          status: 'completed',
          audioUrl: MOCK_AUDIO_URL,
        });
      }
    }

    // Get the API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_MUREKA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { message: 'API key not configured' },
        { status: 401 },
      );
    }

    // Query the Mureka API for the task status
    console.log(`Checking status for task ID: "${id}"`);

    // Use the correct endpoint format from documentation: /v1/instrumental/query/{task_id}
    const statusUrl = `${API_BASE_URL}/v1/instrumental/query/${id}`;

    console.log(`Status check URL: ${statusUrl}`);
    console.log(`Headers: Authorization: Bearer ${apiKey.substring(0, 5)}...`);

    try {
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          // Add cache control headers
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
        },
      });

      console.log(
        `Status response code: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        // Try to get the error message
        const errorText = await response
          .text()
          .catch((e) => `Could not read response: ${e.message}`);
        console.error(`Error response from Mureka: ${errorText}`);

        return NextResponse.json(
          { message: 'Failed to check generation status', error: errorText },
          { status: response.status },
        );
      }

      // Successfully got a response
      const responseData = await response.json();
      console.log(
        'Status API full response:',
        JSON.stringify(responseData, null, 2),
      );

      // Check for audio URL information
      console.log('Looking for audio URL in response:');
      if (responseData.choices && responseData.choices.length > 0) {
        console.log(
          '- Found choices array with URLs:',
          responseData.choices[0]?.url,
          responseData.choices[0]?.flac_url,
        );
      }
      if (responseData.url) {
        console.log('- Found direct URL:', responseData.url);
      }
      if (responseData.audioUrl) {
        console.log('- Found audioUrl:', responseData.audioUrl);
      }

      return NextResponse.json(responseData, {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
        },
      });
    } catch (error) {
      console.error('Error querying task status:', error);
      return NextResponse.json(
        {
          message: 'Error querying task status',
          error: error instanceof Error ? error.message : String(error),
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
  } catch (error) {
    console.error('Status check error:', error);
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
