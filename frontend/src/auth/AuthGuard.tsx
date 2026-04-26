import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from './useSession';
import { colors } from '../design/tokens';

interface AuthGuardProps {
    children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading } = useSession();

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: colors.global.canvas,
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            border: `3px solid ${colors.global.border}`,
                            borderTopColor: colors.accent,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px',
                        }}
                    />
                    <p style={{ color: colors.global.text.secondary, fontSize: '14px' }}>
                        Loading...
                    </p>
                </div>
                <style>
                    {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
                </style>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}