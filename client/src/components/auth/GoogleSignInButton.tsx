import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as authApi from '../../api/auth';
import { useAuthStore } from '../../stores/authStore';
import { GOOGLE_CLIENT_ID } from '../../lib/constants';

/**
 * Google Sign-In button using Google Identity Services (GIS).
 * Renders the official Google-styled button.
 * On credential response, sends the ID token to the backend.
 */
export default function GoogleSignInButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        const { user, accessToken } = await authApi.googleLogin(response.credential);
        setAuth(user, accessToken);
        toast.success(`Welcome, ${user.name}!`);
        navigate('/');
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
            ?.error?.message || 'Google sign-in failed. Please try again.';
        toast.error(message);
      }
    },
    [setAuth, navigate]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID not set — Google Sign-In disabled');
      return;
    }

    // Load the Google Identity Services script if not already present
    const existingScript = document.getElementById('google-gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initializeGoogle();
      document.head.appendChild(script);
    } else {
      // Script already loaded — just initialize
      initializeGoogle();
    }

    function initializeGoogle() {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID!,
        callback: handleCredentialResponse,
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 320,
          shape: 'rectangular',
          text: 'continue_with',
        });
      }
    }
  }, [handleCredentialResponse]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {/* Google button rendered by GIS */}
      <div ref={buttonRef} id="google-signin-button" />
    </div>
  );
}

// ─── Google Identity Services type declarations ──────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              shape?: string;
              text?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}
