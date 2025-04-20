import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | DAW',
    default: 'DAW | Digital Audio Workstation',
  },
  description: 'Create and produce music with AI-powered tools',
};

export default function DAWLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-primary">AI DAW</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href="/dashboard"
              className="transition-colors hover:text-foreground/80"
            >
              Home
            </a>
            <a
              href="/daw/projects"
              className="transition-colors hover:text-foreground/80"
            >
              Projects
            </a>
            <a
              href="/daw/studio"
              className="transition-colors hover:text-foreground/80"
            >
              Studio
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
