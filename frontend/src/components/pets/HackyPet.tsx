import { motion } from 'framer-motion';
import { colors, type PlatformId, type Mood } from '../../design/tokens';

interface HackyPetProps {
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

const starRotateVariant = {
    rotate: [0, 360],
    transition: {
        repeat: Infinity,
        duration: 8,
        ease: 'linear',
    },
};

export function HackyPet({ mood, platformId, size = 120 }: HackyPetProps) {
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
            aria-label={`HackyPet, your ${platformId} companion, currently ${mood}`}
        >
            {/* Hexagonal body */}
            <path
                d="M 60 25 L 85 40 L 85 70 L 60 85 L 35 70 L 35 40 Z"
                fill={lightColor}
            />

            {/* Star antenna on top */}
            <line
                x1="60"
                y1="25"
                x2="60"
                y2="10"
                stroke={accentColor}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <motion.g animate={starRotateVariant}>
                <path
                    d="M 60 5 L 62 9 L 66 9 L 63 12 L 64 16 L 60 13 L 56 16 L 57 12 L 54 9 L 58 9 Z"
                    fill={accentColor}
                />
            </motion.g>

            {/* Eyes - friendly round eyes */}
            <circle cx="50" cy="50" r="6" fill={colors.global.canvas} />
            <motion.circle
                cx="50"
                cy="50"
                r="3"
                fill={accentColor}
                animate={blinkVariant}
            />

            <circle cx="70" cy="50" r="6" fill={colors.global.canvas} />
            <motion.circle
                cx="70"
                cy="50"
                r="3"
                fill={accentColor}
                animate={blinkVariant}
            />

            {/* Eye shine */}
            <circle cx="51" cy="48" r="1.5" fill="white" opacity="0.9" />
            <circle cx="71" cy="48" r="1.5" fill="white" opacity="0.9" />

            {/* Mouth expressions based on mood */}
            {mood === 'excited' && (
                <path
                    d="M 50 62 Q 60 68 70 62"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            )}

            {mood === 'active' && (
                <line
                    x1="52"
                    y1="64"
                    x2="68"
                    y2="64"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            )}

            {mood === 'idle' && (
                <line
                    x1="52"
                    y1="64"
                    x2="68"
                    y2="64"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            )}

            {mood === 'neglected' && (
                <path
                    d="M 50 66 Q 60 62 70 66"
                    stroke={accentColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            )}

            {/* Hexagon accent edges */}
            <path
                d="M 60 25 L 85 40"
                stroke={accentColor}
                strokeWidth="1.5"
                opacity="0.5"
            />
            <path
                d="M 85 70 L 60 85"
                stroke={accentColor}
                strokeWidth="1.5"
                opacity="0.5"
            />
            <path
                d="M 35 70 L 35 40"
                stroke={accentColor}
                strokeWidth="1.5"
                opacity="0.5"
            />

            {/* Small decorative elements */}
            <circle cx="44" cy="74" r="2" fill={accentColor} opacity="0.6" />
            <circle cx="76" cy="74" r="2" fill={accentColor} opacity="0.6" />
        </motion.svg>
    );
}