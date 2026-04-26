import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../auth/useSession';
import { colors, spacing, radius } from '../design/tokens';

export function Login() {
    const navigate = useNavigate();
    const { signIn, signUp } = useSession();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password);

            if (error) {
                // User-friendly error messages
                if (error.message.includes('Invalid login credentials')) {
                    setError('Invalid email or password');
                } else if (error.message.includes('Email not confirmed')) {
                    setError('Please check your email to confirm your account');
                } else if (error.message.includes('User already registered')) {
                    setError('An account with this email already exists');
                } else {
                    setError('Something went wrong. Please try again.');
                }
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.global.canvas,
                padding: `${spacing.md}px`,
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: colors.global.overlay,
                    border: `1px solid ${colors.global.border}`,
                    borderRadius: `${radius}px`,
                    padding: `${spacing.lg}px`,
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: `${spacing.lg}px` }}>
                    <h1
                        style={{
                            fontSize: '24px',
                            fontWeight: 500,
                            color: colors.global.text.primary,
                            margin: 0,
                            marginBottom: `${spacing.xs}px`,
                        }}
                    >
                        Welcome to Luni
                    </h1>
                    <p
                        style={{
                            fontSize: '14px',
                            color: colors.global.text.secondary,
                            margin: 0,
                        }}
                    >
                        Your luminous companions await
                    </p>
                </div>

                <form onSubmit={handleSubmit} aria-labelledby="login-title">
                    <div style={{ marginBottom: `${spacing.md}px` }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: colors.global.text.primary,
                                marginBottom: `${spacing.xs}px`,
                            }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '14px',
                                color: colors.global.text.primary,
                                backgroundColor: colors.global.canvas,
                                border: `1px solid ${colors.global.border}`,
                                borderRadius: `${radius}px`,
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = colors.accent;
                                e.target.style.boxShadow = `0 0 0 2px ${colors.accent}33`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.global.border;
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: `${spacing.md}px` }}>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: colors.global.text.primary,
                                marginBottom: `${spacing.xs}px`,
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            minLength={6}
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '14px',
                                color: colors.global.text.primary,
                                backgroundColor: colors.global.canvas,
                                border: `1px solid ${colors.global.border}`,
                                borderRadius: `${radius}px`,
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = colors.accent;
                                e.target.style.boxShadow = `0 0 0 2px ${colors.accent}33`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.global.border;
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            style={{
                                padding: '12px',
                                marginBottom: `${spacing.md}px`,
                                backgroundColor: `${colors.danger}22`,
                                border: `1px solid ${colors.danger}`,
                                borderRadius: `${radius}px`,
                                fontSize: '14px',
                                color: colors.danger,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            minHeight: '44px',
                            padding: '12px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: colors.global.canvas,
                            backgroundColor: loading ? colors.global.border : colors.success,
                            border: 'none',
                            borderRadius: `${radius}px`,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s',
                            outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.backgroundColor = '#2ea043';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.currentTarget.style.backgroundColor = colors.success;
                            }
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.success}66`;
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>

                <div
                    style={{
                        marginTop: `${spacing.md}px`,
                        textAlign: 'center',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: colors.accent,
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: '4px',
                        }}
                    >
                        {isSignUp
                            ? 'Already have an account? Sign In'
                            : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}