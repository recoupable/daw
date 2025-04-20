/**
 * MUREKA.ai API Integration
 *
 * This file contains utilities for interacting with the MUREKA.ai API
 * for audio generation capabilities in the DAW application.
 */

// API endpoints
const API_BASE_URL =
  process.env.NEXT_PUBLIC_MUREKA_API_URL || 'https://api.mureka.ai';
const API_VERSION = 'v1';

// API endpoint paths
const ENDPOINTS = {
  GENERATE_AUDIO: `/api/${API_VERSION}/generate`,
  FETCH_STATUS: `/api/${API_VERSION}/status`,
  LIST_MODELS: `/api/${API_VERSION}/models`,
};

// Types
export interface GenerateAudioParams {
  prompt: string;
  duration?: number; // Duration in seconds
  tempo?: number; // BPM
  key?: string; // Musical key
  model?: string; // Model to use
}

export interface AudioGenerationResponse {
  id: string; // Generation ID
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number; // Estimated completion time in seconds
  audioUrl?: string; // URL to download the generated audio (only when completed)
  error?: string; // Error message if failed
}

/**
 * API key management
 */
const getApiKey = (): string | null => {
  // For production, use environment variable
  if (process.env.NEXT_PUBLIC_MUREKA_API_KEY) {
    return process.env.NEXT_PUBLIC_MUREKA_API_KEY;
  }

  // For development, check localStorage (client-side only)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mureka_api_key');
  }

  return null;
};

export const setApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mureka_api_key', key);
  }
};

/**
 * API request helper
 */
const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  data?: object,
): Promise<T> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      'API key not found. Please configure the MUREKA.ai API key.',
    );
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ||
          `API request failed with status ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error('MUREKA API error:', error);
    throw error;
  }
};

/**
 * API functions
 */

/**
 * Generate audio using MUREKA.ai API
 */
export const generateAudio = async (
  params: GenerateAudioParams,
): Promise<AudioGenerationResponse> => {
  return await apiRequest<AudioGenerationResponse>(
    ENDPOINTS.GENERATE_AUDIO,
    'POST',
    params,
  );
};

/**
 * Check status of audio generation
 */
export const checkGenerationStatus = async (
  generationId: string,
): Promise<AudioGenerationResponse> => {
  return await apiRequest<AudioGenerationResponse>(
    `${ENDPOINTS.FETCH_STATUS}/${generationId}`,
  );
};

/**
 * List available models
 */
export const listModels = async (): Promise<string[]> => {
  const response = await apiRequest<{ models: string[] }>(
    ENDPOINTS.LIST_MODELS,
  );
  return response.models;
};

/**
 * Verify API key is valid
 */
export const verifyApiKey = async (): Promise<boolean> => {
  try {
    await listModels();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Mock implementation for testing (when API key is not available)
 */
export const mockGenerateAudio = async (
  params: GenerateAudioParams,
): Promise<AudioGenerationResponse> => {
  console.log('Using mock audio generation with params:', params);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock response
  return {
    id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    status: 'completed',
    audioUrl: '/audio/mock-generated-audio.mp3',
  };
};

export default {
  generateAudio,
  checkGenerationStatus,
  listModels,
  verifyApiKey,
  setApiKey,
  mockGenerateAudio,
};
