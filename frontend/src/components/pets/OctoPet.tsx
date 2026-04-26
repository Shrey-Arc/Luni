import { motion } from 'framer-motion';
import { colors, type PlatformId, type Mood } from '../../design/tokens';

interface OctoPetProps {
    mood: Mood;
    platformId: PlatformId;
    size?: number;
}

const moodVariants = {
    idle: {
        y: [0, -8, 0],
        transition: {
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
        },
    },
    active: {
        scale: [1, 1.05, 1],
        transition: {
            repeat: Infinity,
            duration: 0.9,
            ease: 'easeInOut',
        },
    },
    excited: {
        y: [0, -14, 0],
        transition: {
            repeat: Infinity,
            duration: 0.4,
            ease: 'easeInOut',
        },
    },
    neglected: {
        x: [-3, 3, -3, 0],
        transition: {
            duration: 0.4,
            repeat: 2,
        },
    },
};

const blinkVariant = {
    scaleY: [1, 0.08, 1],
    transition: {
        repeat: Infinity,
        repeatDelay: 4,
        duration: 0.15,
    },
};

export function OctoPet({ mood, platformId, size = 120 }: OctoPetProps) {
    const accentColor = colors.platforms[platformId].primary;
    const lightColor = colors.platforms[platformId].light;

    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial="idle"
            animate={mood}
            variants={moodVariants}
            role="img"
            aria-label={`OctoPet, your ${platformId} companion, currently ${mood}`}
        >
            {/* Body - round blob */}
            <ellipse
                cx="60"
                cy="50"
                rx="35"
                ry="32"
                fill={lightColor}
            />

            {/* Small rounded ears */}
            <ellipse
                cx="40"
                cy="25"
                rx="8"
                ry="10"
                fill={lightColor}
            />
            <ellipse
                cx="80"
                cy="25"
                rx="8"
                ry="10"
                fill={lightColor}
            />

            {/* Tentacles at bottom */}
            <path
                d="M 35 75 Q 30 85 28 95"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M 45 75 Q 43 88 42 98"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M 55 75 Q 55 90 55 100"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M 65 75 Q 65 90 65 100"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M 75 75 Q 77 88 78 98"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M 85 75 Q 90 85 92 95"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />

            {/* Left eye */}
            <circle cx="45" cy="45" r="8" fill={colors.global.canvas} />
            <motion.circle
                cx="45"
                cy="45"
                r="4"
                fill={accentColor}
                animate={blinkVariant}
            />
            {/* Eye shine */}
            <circle cx="47" cy="43" r="2" fill="white" opacity="0.8" />

            {/* Right eye */}
            <circle cx="75" cy="45" r="8" fill={colors.global.canvas} />
            <motion.circle
                cx="75"
                cy="45"
                r="4"
                fill={accentColor}
                animate={blinkVariant}
            />
            {/* Eye shine */}
            <circle cx="77" cy="43" r="2" fill="white" opacity="0.8" />

            {/* Happy mouth when excited */}
            {mood === 'excited' && (
                <path
                    d="M 48 58 Q 60 65 72 58"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            )}

            {/* Sad mouth when neglected */}
            {mood === 'neglected' && (
                <path
                    d="M 48 62 Q 60 56 72 62"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            )}
        </motion.svg>
    );
}