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

    console.log(`[STATUS] Request to check status for task ID: "${id}"`);
    console.log(`[STATUS] Request URL: ${request.url}`);
    console.log(
      `[STATUS] Request headers:`,
      JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2),
    );

    if (!id) {
      console.error('[STATUS] Missing task ID parameter');
      return NextResponse.json(
        { message: 'Task ID is required' },
        { status: 400 },
      );
    }

    // If in mock mode, return mock response
    if (MOCK_MODE || id.startsWith('mock-')) {
      console.log(`[STATUS] Using MOCK mode for ID: ${id}`);
      // For demo purposes, simulate different states based on time
      const taskCreationTime =
        Number.parseInt(id.replace('mock-', ''), 10) || Date.now();
      const elapsedSeconds = (Date.now() - taskCreationTime) / 1000;

      // Simulate real-time progress
      if (elapsedSeconds < 10) {
        console.log(
          `[STATUS] Mock response: preparing (${elapsedSeconds.toFixed(1)}s elapsed)`,
        );
        return NextResponse.json({
          id,
          status: 'preparing',
          message: 'Preparing to generate music...',
        });
      } else if (elapsedSeconds < 20) {
        const progress = Math.min(0.5, (elapsedSeconds - 10) / 20);
        console.log(
          `[STATUS] Mock response: processing (${elapsedSeconds.toFixed(1)}s elapsed, progress: ${(progress * 100).toFixed(1)}%)`,
        );
        return NextResponse.json({
          id,
          status: 'processing',
          message: 'Processing your request...',
          progress: progress,
        });
      } else {
        // After 20 seconds, return completed
        console.log(
          `[STATUS] Mock response: completed (${elapsedSeconds.toFixed(1)}s elapsed)`,
        );
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
      console.error('[STATUS] API key not configured');
      return NextResponse.json(
        { message: 'API key not configured' },
        { status: 401 },
      );
    }

    // Query the Mureka API for the task status
    console.log(`[STATUS] Checking status for task ID: "${id}"`);

    // Use the correct endpoint format from documentation: /v1/instrumental/query/{task_id}
    const statusUrl = `${API_BASE_URL}/v1/instrumental/query/${id}`;

    console.log(`[STATUS] Status check URL: ${statusUrl}`);
    console.log(
      `[STATUS] Headers: Authorization: Bearer ${apiKey.substring(0, 5)}...`,
    );

    try {
      console.log(
        `[STATUS] Sending request to Mureka API at ${new Date().toISOString()}`,
      );
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
        redirect: 'follow', // Explicitly follow redirects
      });

      console.log(
        `[STATUS] Status response code: ${response.status} ${response.statusText}`,
      );
      console.log(
        `[STATUS] Response headers:`,
        JSON.stringify(
          Object.fromEntries([...response.headers.entries()]),
          null,
          2,
        ),
      );

      // Check if response was redirected
      if (response.redirected) {
        console.log(`[STATUS] ⚠️ Request was redirected to: ${response.url}`);
      }

      if (!response.ok) {
        // Try to get the error message as raw text first
        const errorText = await response.text();
        console.error(
          `[STATUS] Error response from Mureka: ${errorText.substring(0, 200)}...`,
        );

        // Check if we got HTML instead of JSON (common with auth failures)
        if (
          errorText.trim().startsWith('<!DOCTYPE') ||
          errorText.trim().startsWith('<html')
        ) {
          console.error(
            '[STATUS] Received HTML response instead of JSON - likely auth error',
          );

          // Try to extract any useful information from the HTML
          let diagnosticInfo = 'HTML error page received';
          if (errorText.includes('<title>')) {
            const titleMatch = errorText.match(/<title>(.*?)<\/title>/i);
            if (titleMatch?.[1]) {
              diagnosticInfo = titleMatch[1];
              console.error(`[STATUS] HTML title: ${diagnosticInfo}`);
            }
          }

          return NextResponse.json(
            {
              message:
                'Failed to check generation status - authentication error',
              error: diagnosticInfo,
              status: 'failed',
              diagnostics: {
                responseStatus: response.status,
                responseType: 'html',
                apiUrl: statusUrl.replace(apiKey, '[REDACTED]'),
              },
            },
            { status: response.status },
          );
        }

        // Try to parse as JSON if it looks like JSON
        let errorData = null;
        if (errorText.trim().startsWith('{')) {
          try {
            errorData = JSON.parse(errorText);
            console.error('[STATUS] Parsed error data:', errorData);
          } catch (e) {
            console.error(
              '[STATUS] Error text looked like JSON but failed to parse',
            );
          }
        }

        return NextResponse.json(
          {
            message: 'Failed to check generation status',
            error: errorText,
            errorData: errorData,
            status: 'failed',
          },
          { status: response.status },
        );
      }

      // Successfully got a response
      const responseText = await response.text();
      console.log(
        `[STATUS] Raw response preview: ${responseText.substring(0, 200)}...`,
      );
      let responseData: any; // Add explicit type to avoid implicit any

      // Safety check - make sure we got valid JSON
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(
          '[STATUS] Invalid JSON response from Mureka API:',
          responseText.substring(0, 200),
        );

        return NextResponse.json(
          {
            message: 'Invalid JSON response from music generation API',
            error: 'Failed to parse API response as JSON',
            rawResponse: responseText.substring(0, 500),
            status: 'failed',
          },
          { status: 500 },
        );
      }

      console.log(
        '[STATUS] Status API full response:',
        JSON.stringify(responseData, null, 2),
      );

      // Check for audio URL information
      console.log('[STATUS] Looking for audio URL in response:');
      if (responseData.choices && responseData.choices.length > 0) {
        console.log(
          '[STATUS] - Found choices array with URLs:',
          responseData.choices[0]?.url,
          responseData.choices[0]?.flac_url,
        );
      }
      if (responseData.url) {
        console.log('[STATUS] - Found direct URL:', responseData.url);
      }
      if (responseData.audioUrl) {
        console.log('[STATUS] - Found audioUrl:', responseData.audioUrl);
      }

      // Create final response
      const ourResponse = NextResponse.json(responseData, {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
        },
      });

      console.log(
        `[STATUS] Returning response with status ${responseData.status} at ${new Date().toISOString()}`,
      );
      return ourResponse;
    } catch (error) {
      console.error('[STATUS] Error querying task status:', error);
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
    console.error('[STATUS] Status check error:', error);
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
