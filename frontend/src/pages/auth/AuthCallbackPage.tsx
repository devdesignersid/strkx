import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/lib/toast';

/**
 * OAuth Callback Handler
 * Handles the redirect from Google OAuth with JWT token in URL
 * Stores token in localStorage for Safari compatibility
 */
export default function AuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Store token in localStorage (Safari-compatible)
            localStorage.setItem('auth_token', token);

            // Redirect to dashboard
            navigate('/', { replace: true });
            toast.success('Successfully logged in!');
        } else {
            // No token found, redirect to login
            navigate('/login', { replace: true });
            toast.error('Authentication failed. Please try again.');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-neutral-400">Completing authentication...</p>
            </div>
        </div>
    );
}
