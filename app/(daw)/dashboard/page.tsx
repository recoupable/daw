'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Generative AI DAW</h1>
      <p className="text-lg text-muted-foreground">
        Create music with AI-powered tools and arrange tracks in your browser.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>DAW Studio</CardTitle>
            <CardDescription>
              Arrange and mix audio tracks using our digital audio workstation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Access the full DAW interface with timeline, tracks, and audio
              controls.
            </p>
            <Button asChild>
              <Link href="/studio">Open Studio</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Browse and manage your music projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              View your saved projects, create new ones, or collaborate with
              others.
            </p>
            <Button asChild variant="outline">
              <Link href="/projects">View Projects</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Text to Audio</CardTitle>
            <CardDescription>
              Generate speech from text using Mureka AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Test the text-to-speech functionality to create vocal content for
              your projects.
            </p>
            <Button asChild variant="outline">
              <Link href="/text-to-audio">Try Text to Audio</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Text to Music</CardTitle>
            <CardDescription>
              Generate instrumental music from text descriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Test the AI music generation functionality to create instrumental
              tracks for your projects.
            </p>
            <Button asChild variant="outline">
              <Link href="/text-to-music">Try Text to Music</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure your DAW settings and API integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Set up your MUREKA.ai API key and customize your DAW experience.
            </p>
            <Button asChild variant="outline">
              <Link href="/settings">Open Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
