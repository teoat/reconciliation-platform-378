/**
 * OAuth Hook
 * 
 * Handles Google OAuth integration and button rendering
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/services/logger';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

interface UseOAuthProps {
  googleClientId?: string;
}

export const useOAuth = ({ googleClientId }: UseOAuthProps) => {
  const { googleOAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isGoogleButtonLoading, setIsGoogleButtonLoading] = useState(false);
  const [googleButtonError, setGoogleButtonError] = useState(false);
  const [googleButtonRetryKey, setGoogleButtonRetryKey] = useState(0);

  const handleGoogleSignIn = useCallback(
    async (response: { credential: string }) => {
      try {
        logger.info('Google Sign-In initiated', { component: 'AuthPage', category: 'oauth' });
        const result = await googleOAuth(response.credential);
        if (result.success) {
          toast.success('Successfully signed in with Google');
          navigate('/', { replace: true });
        } else {
          toast.error(result.error || 'Failed to sign in with Google');
        }
      } catch (error) {
        logger.error('Google Sign-In error', {
          component: 'AuthPage',
          category: 'oauth',
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error('An error occurred during Google sign-in');
      }
    },
    [googleOAuth, toast, navigate]
  );

  const renderGoogleButton = useCallback(
    (retries = 10, delay = 300): void => {
      if (retries === 0) {
        logger.error('Failed to render Google Sign-In button after multiple attempts', {
          component: 'AuthPage',
          category: 'oauth',
          clientIdSet: !!googleClientId,
          windowGoogleExists: typeof window.google !== 'undefined',
          refExists: !!googleButtonRef.current,
        });
        setIsGoogleButtonLoading(false);
        setGoogleButtonError(true);
        return;
      }

      if (typeof window.google === 'undefined' || !window.google?.accounts?.id) {
        setTimeout(() => {
          renderGoogleButton(retries - 1, delay);
        }, delay);
        return;
      }

      if (!googleButtonRef.current) {
        setTimeout(() => {
          renderGoogleButton(retries - 1, delay);
        }, delay);
        return;
      }

      try {
        const existingIframe = googleButtonRef.current.querySelector(
          'iframe[src*="accounts.google.com"]'
        );
        if (existingIframe && existingIframe.parentNode === googleButtonRef.current) {
          setIsGoogleButtonLoading(false);
          setGoogleButtonError(false);
          return;
        }

        const element = googleButtonRef.current;
        if (element.replaceChildren) {
          element.replaceChildren();
        } else {
          element.innerHTML = '';
        }

        try {
          window.google!.accounts.id.initialize({
            client_id: googleClientId!,
            callback: handleGoogleSignIn,
          });
        } catch (initError) {
          logger.warn('Google initialize may have been called already', {
            component: 'AuthPage',
            category: 'oauth',
            error: initError instanceof Error ? initError.message : String(initError),
          });
        }

        window.google!.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
        });

        setTimeout(() => {
          const renderedIframe = googleButtonRef.current?.querySelector(
            'iframe[src*="accounts.google.com"]'
          );
          if (renderedIframe) {
            logger.info('Google Sign-In button rendered successfully', {
              component: 'AuthPage',
              category: 'oauth',
            });
            setIsGoogleButtonLoading(false);
            setGoogleButtonError(false);
          } else {
            logger.warn('Google button render did not create iframe, retrying', {
              component: 'AuthPage',
              category: 'oauth',
            });
            renderGoogleButton(retries - 1, delay);
          }
        }, 100);
      } catch (error) {
        logger.error('Error rendering Google Sign-In button', {
          component: 'AuthPage',
          category: 'oauth',
          error: error instanceof Error ? error.message : String(error),
        });
        setTimeout(() => {
          renderGoogleButton(retries - 1, delay);
        }, delay);
      }
    },
    [googleClientId, handleGoogleSignIn]
  );

  useEffect(() => {
    if (!googleClientId) return;

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google?.accounts?.id) {
        setIsGoogleButtonLoading(true);
        renderGoogleButton();
      } else {
        setIsGoogleButtonLoading(true);
        const checkInterval = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(checkInterval);
            renderGoogleButton();
          }
        }, 100);

        const timeoutId = setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.google?.accounts?.id) {
            setIsGoogleButtonLoading(false);
            setGoogleButtonError(true);
          }
        }, 10000);

        return () => {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
        };
      }
    } else {
      setIsGoogleButtonLoading(true);
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        renderGoogleButton();
      };
      script.onerror = () => {
        setIsGoogleButtonLoading(false);
        setGoogleButtonError(true);
      };
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [googleClientId, renderGoogleButton, googleButtonRetryKey]);

  return {
    googleButtonRef,
    isGoogleButtonLoading,
    googleButtonError,
    setGoogleButtonRetryKey,
  };
};

