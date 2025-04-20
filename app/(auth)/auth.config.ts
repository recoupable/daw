import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/studio',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnStudio = nextUrl.pathname.startsWith('/studio');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isRootPath = nextUrl.pathname === '/';

      // Allow audio API routes without authentication
      const isAudioApiRoute =
        nextUrl.pathname.startsWith('/api/text-to-music') ||
        nextUrl.pathname.startsWith('/api/audio-proxy');

      if (isAudioApiRoute) {
        return true; // Always allow access to audio API routes
      }

      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL('/studio', nextUrl as unknown as URL));
      }

      if (isOnRegister || isOnLogin) {
        return true; // Always allow access to register and login pages
      }

      if (isOnStudio) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isRootPath) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL('/login', nextUrl as unknown as URL));
      }

      if (isLoggedIn) {
        return Response.redirect(new URL('/studio', nextUrl as unknown as URL));
      }

      return true; // Allow access to other public routes
    },
  },
} satisfies NextAuthConfig;
