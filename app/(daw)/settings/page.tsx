'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { CheckCircle, AlertCircle, ExternalLink, Lock } from 'lucide-react';
import { setApiKey } from '../../lib/mureka-api';

export default function SettingsPage() {
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState<string>('');

  useEffect(() => {
    // Check if API key exists in environment variables
    const hasApiKey = Boolean(
      process.env.NEXT_PUBLIC_MUREKA_API_KEY ||
        localStorage.getItem('mureka_api_key'),
    );
    setApiKeyConfigured(hasApiKey);

    // Show initial success message
    if (hasApiKey) {
      setAlertType('success');
      setAlertMessage('Mureka API key is already configured');
      setShowAlert(true);

      // Hide alert after 3 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    }
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {showAlert && (
        <div
          className={`mb-4 p-4 border rounded-lg flex items-start ${
            alertType === 'success'
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}
          role="alert"
        >
          {alertType === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
          )}
          <div>
            <h5 className="font-medium">
              {alertType === 'success' ? 'Success' : 'Error'}
            </h5>
            <div className="text-sm">{alertMessage}</div>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mureka API Configuration</CardTitle>
          <CardDescription>
            API key status for Mureka AI-powered audio generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full gap-4">
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <Lock className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <h3 className="font-medium">API Key Pre-Configured</h3>
                <p className="text-sm text-muted-foreground">
                  The Mureka API key is already configured in the application.
                  No action required.
                </p>
              </div>
            </div>

            <div className="flex items-center mt-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 bg-green-500" />
                <span className="text-sm font-medium">API Key Active</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <p className="mt-2">
                The API key is securely stored and is used for authentication
                with the Mureka API.
              </p>
              <p className="mt-2">
                API Format:{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audio Settings</CardTitle>
          <CardDescription>
            Configure audio output and processing settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Additional audio settings will be available in future updates.
          </p>
          <p className="text-sm text-muted-foreground">
            For API reference and examples, visit the{' '}
            <a
              href="https://platform.mureka.ai/docs/en/quickstart.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center hover:underline"
            >
              Mureka documentation <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
