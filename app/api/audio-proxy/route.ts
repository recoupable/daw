import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the URL from the query params
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    console.error('[AUDIO-PROXY] Missing URL parameter');
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 },
    );
  }

  try {
    console.log(`[AUDIO-PROXY] Proxying audio from: ${url}`);
    console.log(
      `[AUDIO-PROXY] Request headers:`,
      JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2),
    );

    // Fetch the audio file
    console.log(`[AUDIO-PROXY] Sending fetch request to: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Accept: '*/*',
        'User-Agent': 'Mozilla/5.0 DAW Audio Proxy',
      },
      redirect: 'follow', // Explicitly follow redirects
    });

    console.log(
      `[AUDIO-PROXY] Response status: ${response.status} ${response.statusText}`,
    );
    console.log(
      `[AUDIO-PROXY] Response headers:`,
      JSON.stringify(
        Object.fromEntries([...response.headers.entries()]),
        null,
        2,
      ),
    );

    // Check if response was redirected
    if (response.redirected) {
      console.log(`[AUDIO-PROXY] ⚠️ Request was redirected to: ${response.url}`);
    }

    if (!response.ok) {
      // Get the raw response to better understand the error
      const responseText = await response.text();

      // Log the first part of the response for debugging
      console.error(
        `[AUDIO-PROXY] Error response from audio URL (${response.status}): ${responseText.substring(0, 200)}...`,
      );

      // Check if we got HTML instead of audio
      if (
        responseText.trim().startsWith('<!DOCTYPE') ||
        responseText.trim().startsWith('<html')
      ) {
        console.error(
          '[AUDIO-PROXY] Received HTML response instead of audio data',
        );

        // Extract any useful error messages from common HTML patterns
        let errorMessage = `Failed to fetch audio: ${response.status} ${response.statusText}`;
        if (responseText.includes('<title>')) {
          const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
          if (titleMatch?.[1]) {
            errorMessage += ` - ${titleMatch[1]}`;
          }
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: response.status },
        );
      }

      return NextResponse.json(
        {
          error: `Failed to fetch audio: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    // Get the audio buffer
    const arrayBuffer = await response.arrayBuffer();

    // Get the content type (default to mp3 if not available)
    const contentType = response.headers.get('content-type') || 'audio/mpeg';

    // Log successful proxy details
    console.log(`[AUDIO-PROXY] ✅ Successfully proxied audio: ${url}`);
    console.log(
      `[AUDIO-PROXY] Content-Type: ${contentType}, Size: ${arrayBuffer.byteLength} bytes`,
    );

    // Create a new response with the audio data
    const proxyResponse = new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': arrayBuffer.byteLength.toString(),
        // Prevent caching of audio content
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });

    console.log(
      `[AUDIO-PROXY] Proxy response headers:`,
      JSON.stringify(
        Object.fromEntries([...proxyResponse.headers.entries()]),
        null,
        2,
      ),
    );
    return proxyResponse;
  } catch (error) {
    console.error('[AUDIO-PROXY] Error proxying audio:', error);
    return NextResponse.json(
      { error: 'Failed to proxy audio', details: String(error) },
      { status: 500 },
    );
  }
}
