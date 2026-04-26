import { motion } from 'framer-motion';
import { colors, type PlatformId, type Mood } from '../../design/tokens';

interface SparkPetProps {
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

const sparkleVariant = {
    scale: [0.8, 1.2, 0.8],
    opacity: [0.5, 1, 0.5],
    transition: {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut',
    },
};

export function SparkPet({ mood, platformId, size = 120 }: SparkPetProps) {
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
            aria-label={`SparkPet, your ${platformId} companion, currently ${mood}`}
        >
            {/* Round body */}
            <circle cx="60" cy="60" r="30" fill={lightColor} />

            {/* Cat ears - pointy triangles */}
            <path
                d="M 38 35 L 32 20 L 45 30 Z"
                fill={lightColor}
            />
            <path
                d="M 82 35 L 88 20 L 75 30 Z"
                fill={lightColor}
            />

            {/* Inner ear detail */}
            <path
                d="M 38 32 L 35 24 L 42 30 Z"
                fill={accentColor}
                opacity="0.4"
            />
            <path
                d="M 82 32 L 85 24 L 78 30 Z"
                fill={accentColor}
                opacity="0.4"
            />

            {/* Star-shaped cheek marks */}
            <motion.g animate={sparkleVariant}>
                <path
                    d="M 35 58 L 37 60 L 39 58 L 37 56 Z"
                    fill={accentColor}
                />
                <circle cx="35" cy="58" r="1" fill={accentColor} />
            </motion.g>

            <motion.g animate={sparkleVariant}>
                <path
                    d="M 85 58 L 87 60 L 89 58 L 87 56 Z"
                    fill={accentColor}
                />
                <circle cx="85" cy="58" r="1" fill={accentColor} />
            </motion.g>

            {/* Expressive circular eyes */}
            <circle cx="50" cy="55" r="7" fill={colors.global.canvas} />
            <motion.circle
                cx="50"
                cy="55"
                r="4"
                fill={accentColor}
                animate={blinkVariant}
            />
            {/* Eye shine */}
            <circle cx="52" cy="53" r="2" fill="white" opacity="0.8" />

            <circle cx="70" cy="55" r="7" fill={colors.global.canvas} />
            <motion.circle
                cx="70"
                cy="55"
                r="4"
                fill={accentColor}
                animate={blinkVariant}
            />
            {/* Eye shine */}
            <circle cx="72" cy="53" r="2" fill="white" opacity="0.8" />

            {/* Nose */}
            <path
                d="M 60 64 L 58 67 L 60 68 L 62 67 Z"
                fill={accentColor}
            />

            {/* Mouth expressions based on mood */}
            {mood === 'excited' && (
                <>
                    <path
                        d="M 52 70 Q 60 76 68 70"
                        stroke={accentColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Whiskers */}
                    <line x1="35" y1="62" x2="25" y2="60" stroke={accentColor} strokeWidth="1.5" />
                    <line x1="35" y1="66" x2="25" y2="68" stroke={accentColor} strokeWidth="1.5" />
                    <line x1="85" y1="62" x2="95" y2="60" stroke={accentColor} strokeWidth="1.5" />
                    <line x1="85" y1="66" x2="95" y2="68" stroke={accentColor} strokeWidth="1.5" />
                </>
            )}

            {mood === 'active' && (
                <>
                    <path
                        d="M 54 72 Q 60 74 66 72"
                        stroke={accentColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Whiskers */}
                    <line x1="35" y1="64" x2="25" y2="64" stroke={accentColor} strokeWidth="1.5" />
                    <line x1="85" y1="64" x2="95" y2="64" stroke={accentColor} strokeWidth="1.5" />
                </>
            )}

            {mood === 'idle' && (
                <>
                    <line
                        x1="54"
                        y1="72"
                        x2="66"
                        y2="72"
                        stroke={accentColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    {/* Whiskers */}
                    <line x1="35" y1="64" x2="25" y2="64" stroke={accentColor} strokeWidth="1.5" />
                    <line x1="85" y1="64" x2="95" y2="64" stroke={accentColor} strokeWidth="1.5" />
                </>
            )}

            {mood === 'neglected' && (
                <>
                    <path
                        d="M 52 74 Q 60 70 68 74"
                        stroke={accentColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Droopy whiskers */}
                    <line x1="35" y1="64" x2="25" y2="68" stroke={accentColor} strokeWidth="1.5" />
                    <line x1="85" y1="64" x2="95" y2="68" stroke={accentColor} strokeWidth="1.5" />
                </>
            )}

            {/* Small paws at bottom */}
            <ellipse cx="48" cy="88" rx="6" ry="4" fill={accentColor} opacity="0.6" />
            <ellipse cx="72" cy="88" rx="6" ry="4" fill={accentColor} opacity="0.6" />
        </motion.svg>
    );
}