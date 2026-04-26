import { motion } from 'framer-motion';
import { colors, type PlatformId, type Mood } from '../../design/tokens';

interface AlgoPetProps {
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

const antennaBlinkVariant = {
    opacity: [1, 0.3, 1],
    transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'easeInOut',
    },
};

export function AlgoPet({ mood, platformId, size = 120 }: AlgoPetProps) {
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
            aria-label={`AlgoPet, your ${platformId} companion, currently ${mood}`}
        >
            {/* Boxy rounded body */}
            <rect
                x="30"
                y="35"
                width="60"
                height="55"
                rx="8"
                fill={lightColor}
            />

            {/* Antenna */}
            <line
                x1="60"
                y1="35"
                x2="60"
                y2="18"
                stroke={accentColor}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <motion.circle
                cx="60"
                cy="15"
                r="4"
                fill={accentColor}
                animate={antennaBlinkVariant}
            />

            {/* Screen face showing code or mood expression */}
            <rect
                x="40"
                y="45"
                width="40"
                height="30"
                rx="4"
                fill={colors.global.canvas}
            />

            {/* Screen content based on mood */}
            {mood === 'excited' && (
                <>
                    {/* Happy code brackets */}
                    <text
                        x="60"
                        y="67"
                        textAnchor="middle"
                        fontSize="20"
                        fill={accentColor}
                        fontFamily="monospace"
                    >
                        {'{}'}
                    </text>
                    <circle cx="52" cy="58" r="2" fill={accentColor} />
                    <circle cx="68" cy="58" r="2" fill={accentColor} />
                </>
            )}

            {mood === 'active' && (
                <>
                    {/* Active processing */}
                    <text
                        x="60"
                        y="67"
                        textAnchor="middle"
                        fontSize="18"
                        fill={accentColor}
                        fontFamily="monospace"
                    >
                        {'</>'}
                    </text>
                </>
            )}

            {mood === 'idle' && (
                <>
                    {/* Neutral screen */}
                    <rect x="48" y="56" width="8" height="2" rx="1" fill={accentColor} />
                    <rect x="64" y="56" width="8" height="2" rx="1" fill={accentColor} />
                    <rect x="52" y="65" width="16" height="2" rx="1" fill={accentColor} />
                </>
            )}

            {mood === 'neglected' && (
                <>
                    {/* Error symbol */}
                    <text
                        x="60"
                        y="68"
                        textAnchor="middle"
                        fontSize="24"
                        fill={colors.danger}
                        fontFamily="monospace"
                    >
                        !
                    </text>
                </>
            )}

            {/* Side panels */}
            <rect
                x="32"
                y="50"
                width="4"
                height="15"
                rx="2"
                fill={accentColor}
                opacity="0.5"
            />
            <rect
                x="84"
                y="50"
                width="4"
                height="15"
                rx="2"
                fill={accentColor}
                opacity="0.5"
            />

            {/* Feet */}
            <rect
                x="38"
                y="90"
                width="12"
                height="8"
                rx="4"
                fill={accentColor}
            />
            <rect
                x="70"
                y="90"
                width="12"
                height="8"
                rx="4"
                fill={accentColor}
            />
        </motion.svg>
    );
}