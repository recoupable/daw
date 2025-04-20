import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the URL from the query params
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 },
    );
  }

  try {
    console.log(`Proxying audio from: ${url}`);

    // Fetch the audio file
    const response = await fetch(url);

    if (!response.ok) {
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

    // Create a new response with the audio data
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': arrayBuffer.byteLength.toString(),
        // Set cache headers to cache the audio
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error proxying audio:', error);
    return NextResponse.json(
      { error: 'Failed to proxy audio' },
      { status: 500 },
    );
  }
}
