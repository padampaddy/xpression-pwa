import React, { useMemo, useState, useEffect } from 'react';
import { Smile, Frown, Meh, Zap, Eye, Ghost, Angry, Annoyed, Heart, Skull, CloudDrizzle, Search, Wind, Target } from 'lucide-react';

import styles from './ExpressionMeter.module.css';

const CircularProgress = ({ value, color, label, icon, onClick }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    // Ensure value is a number between 0 and 1
    const safeValue = Math.min(Math.max(Number(value) || 0, 0), 1);
    const offset = circumference - (safeValue * circumference);

    return (
        <div className={styles.circularProgress} onClick={onClick}>
            <div className={styles.circleContainer}>
                <svg className={styles.svg} style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        className={styles.track}
                    />
                    <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        stroke={color}
                        strokeWidth="3"
                        fill="transparent"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset
                        }}
                        strokeLinecap="round"
                        className={styles.indicator}
                    />
                </svg>
                <div className={styles.iconContainer}>
                    {React.cloneElement(icon, { size: 16 })}
                </div>
            </div>
            <span className={styles.progressLabel}>{label}</span>
        </div>
    );
};

const ExpressionMeter = ({ blendshapes }) => {
    const [selectedEmotion, setSelectedEmotion] = React.useState(null);

    const getScore = (name) => {
        const shape = blendshapes.find(s => s.categoryName === name);
        return shape && typeof shape.score === 'number' ? shape.score : 0;
    };

    const analysis = useMemo(() => {
        if (!blendshapes || blendshapes.length === 0) return null;

        // Raw Blendshape Scores
        const s = {
            smile: (getScore('mouthSmileLeft') + getScore('mouthSmileRight')) / 2,
            browDown: (getScore('browDownLeft') + getScore('browDownRight')) / 2,
            browRaise: (getScore('browOuterUpLeft') + getScore('browOuterUpRight')) / 2,
            browInnerUp: getScore('browInnerUp'),
            eyeWide: (getScore('eyeWideLeft') + getScore('eyeWideRight')) / 2,
            eyeSquint: (getScore('eyeSquintLeft') + getScore('eyeSquintRight')) / 2,
            jawOpen: getScore('jawOpen'),
            noseSneer: (getScore('noseSneerLeft') + getScore('noseSneerRight')) / 2,
            mouthFrown: (getScore('mouthFrownLeft') + getScore('mouthFrownRight')) / 2,
            mouthPucker: getScore('mouthPucker'),
            cheekPuff: getScore('cheekPuff'),
            eyeBlink: (getScore('eyeBlinkLeft') + getScore('eyeBlinkRight')) / 2,
        };

        // Calculated Emotion Scores (0-1)
        // Using weighted combinations of blendshapes for more robust detection
        const emotions = {
            joy: s.smile,
            sad: (s.mouthFrown * 1.5 + s.browInnerUp * 0.8) / 2.3,
            rage: (s.browDown + s.jawOpen * 0.2 + s.eyeSquint * 0.3) / 1.5,
            shock: (s.browRaise + s.eyeWide + s.jawOpen) / 3,
            fear: (s.browInnerUp + s.eyeWide + s.mouthFrown * 0.5) / 2.5,
            disgust: (s.noseSneer + s.browDown * 0.5 + s.eyeSquint * 0.2) / 1.7,
            puff: s.cheekPuff * 1.4,
            kiss: s.mouthPucker * 0.7,
        };

        // Logic: Puff suppresses Kiss (puffing often looks like pucker)
        if (emotions.puff > 0.3) emotions.kiss = 0;

        // Find Dominant Emotion
        let maxScore = 0;
        let dominant = 'neutral';

        Object.entries(emotions).forEach(([name, score]) => {
            if (score > maxScore) {
                maxScore = score;
                dominant = name;
            }
        });

        // Threshold for Neutral
        if (maxScore < 0.15) dominant = 'neutral';

        // Map internal names to Display State
        const stateMap = {
            neutral: { label: 'Neutral', emoji: '😐', color: '#94a3b8', icon: <Meh /> },
            joy: { label: 'Happy', emoji: '😊', color: '#10b981', icon: <Smile /> },
            sad: { label: 'Sad', emoji: '😢', color: '#3b82f6', icon: <Frown /> },
            rage: { label: 'Angry', emoji: '😠', color: '#ef4444', icon: <Angry /> },
            shock: { label: 'Shocked', emoji: '😱', color: '#f59e0b', icon: <Zap /> },
            fear: { label: 'Fear', emoji: '😨', color: '#7c3aed', icon: <Ghost /> },
            disgust: { label: 'Disgusted', emoji: '🤢', color: '#84cc16', icon: <Annoyed /> },
            puff: { label: 'Puff', emoji: '🐡', color: '#d97706', icon: <Wind /> },
            kiss: { label: 'Kissing', emoji: '😘', color: '#f43f5e', icon: <Heart /> },
        };

        return { emotions, state: stateMap[dominant] };
    }, [blendshapes]);

    // Clear selection after 3 seconds
    React.useEffect(() => {
        if (selectedEmotion) {
            const timer = setTimeout(() => setSelectedEmotion(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [selectedEmotion]);

    if (!analysis) return null;

    const { emotions, state } = analysis;

    const metrics = [
        { label: 'Joy', val: emotions.joy, color: '#10b981', icon: <Smile />, instruction: "Smile widely and raise your cheeks!" },
        { label: 'Sad', val: emotions.sad, color: '#3b82f6', icon: <Frown />, instruction: "Frown your mouth and raise inner brows." },
        { label: 'Rage', val: emotions.rage, color: '#ef4444', icon: <Angry />, instruction: "Furrow brows and clench your jaw." },
        { label: 'Shock', val: emotions.shock, color: '#f59e0b', icon: <Zap />, instruction: "Raise brows high and open mouth!" },
        { label: 'Fear', val: emotions.fear, color: '#7c3aed', icon: <Ghost />, instruction: "Raise eyebrows and widen your eyes." },
        { label: 'Disgust', val: emotions.disgust, color: '#84cc16', icon: <Annoyed />, instruction: "Wrinkle your nose and raise upper lip." },
        { label: 'Puff', val: emotions.puff, color: '#d97706', icon: <Wind />, instruction: "Puff out your cheeks like a blowfish!" },
        { label: 'Kiss', val: emotions.kiss, color: '#f43f5e', icon: <Heart />, instruction: "Pucker your lips forward!" },
    ];

    return (
        <div className={styles.container}>

            {/* Main Emotion Label - Floating */}
            <div className={styles.mainEmotion}>
                <h2
                    className={styles.label}
                    style={{ textShadow: `0 0 20px ${state.color}` }}
                >
                    {state.label}
                </h2>
            </div>

            {/* Metrics Grid - 4x2 Layout */}
            <div className={styles.metricsStrip}>

                {/* Instruction Tooltip */}
                {selectedEmotion && (
                    <div className={styles.instructionContainer}>
                        <div className={styles.instructionText}>
                            {selectedEmotion}
                        </div>
                    </div>
                )}

                <div className={styles.metricsGrid}>
                    {metrics.map((m) => (
                        <CircularProgress
                            key={m.label}
                            label={m.label}
                            value={m.val}
                            color={m.color}
                            icon={m.icon}
                            onClick={() => setSelectedEmotion(m.instruction)}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ExpressionMeter;
