import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FaceLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { createFaceLandmarker } from '../utils/faceLandmarker';
import ExpressionMeter from './ExpressionMeter';
import { RefreshCw, Activity, ScanFace } from 'lucide-react';

import styles from './FaceAnalyzer.module.css';

const FaceAnalyzer = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [blendshapes, setBlendshapes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cameraFacingMode, setCameraFacingMode] = useState('user');
    const landmarkerRef = useRef(null);
    const requestRef = useRef(null);
    const initRef = useRef(false);

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        const init = async () => {
            try {
                landmarkerRef.current = await createFaceLandmarker();
                setIsLoading(false);
            } catch (err) {
                console.error(err);
                setError("AI CORE OFFLINE: REINITIALIZATION FAILED");
                setIsLoading(false);
            }
        };
        init();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const predictWebcam = () => {
        if (landmarkerRef.current && webcamRef.current?.video?.readyState === 4 && canvasRef.current && containerRef.current) {
            const video = webcamRef.current.video;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const container = containerRef.current;

            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            const videoRatio = videoWidth / videoHeight;
            const containerRatio = containerWidth / containerHeight;

            let finalWidth, finalHeight;

            if (containerRatio > videoRatio) {
                finalWidth = containerWidth;
                finalHeight = containerWidth / videoRatio;
            } else {
                finalHeight = containerHeight;
                finalWidth = containerHeight * videoRatio;
            }

            if (canvas.width !== finalWidth || canvas.height !== finalHeight) {
                canvas.width = finalWidth;
                canvas.height = finalHeight;
            }

            const startTimeMs = performance.now();
            const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const drawingUtils = new DrawingUtils(ctx);
                for (const landmarks of results.faceLandmarks) {
                    // Draw Mesh - Scaled to canvas
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#22d3ee30", lineWidth: 1 });
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#22d3ee", lineWidth: 2 });
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#a855f7", lineWidth: 2 });
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#f43f5e", lineWidth: 2 });
                    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#ffffff50", lineWidth: 1 });
                }
            }

            setBlendshapes(results.faceBlendshapes?.[0]?.categories || []);
        }
        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    useEffect(() => {
        if (!isLoading && !error) requestRef.current = requestAnimationFrame(predictWebcam);
    }, [isLoading, error]);

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <h1 className={styles.errorTitle}>SYSTEM ERROR</h1>
                <p>{error}</p>
                <button className={styles.retryButton} onClick={() => window.location.reload()}>RETRY</button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={styles.container}>
            {/* Loading Screen */}
            {isLoading && (
                <div className={styles.loadingScreen}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>INITIALIZING...</p>
                </div>
            )}

            {/* Video Background - Forced Full Screen */}
            <div className={styles.videoBackground}>
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored={cameraFacingMode === 'user'}
                    videoConstraints={{
                        facingMode: cameraFacingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }}
                    className={styles.webcam}
                />
                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    style={{
                        transform: `translate(-50%, -50%) ${cameraFacingMode === 'user' ? 'scaleX(-1)' : ''}`
                    }}
                />
            </div>

            {/* Scanline Overlay */}
            <div className={styles.scanlineOverlay}></div>
            <div className={styles.scanningLine}></div>

            {/* HUD Layer */}
            <div className={styles.hudLayer}>

                {/* Top Controls (Camera Flip) */}
                <div className={styles.topControls}>
                    <button
                        onClick={() => setCameraFacingMode(m => m === 'user' ? 'environment' : 'user')}
                        className={styles.iconButton}
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>

                {/* Center Guide (if no face) */}
                {blendshapes.length === 0 && !isLoading && (
                    <div className={styles.centerGuide}>
                        <ScanFace size={64} className={styles.pulse} />
                    </div>
                )}

                {/* Bottom Controls */}
                <div className={styles.bottomControls}>
                    <ExpressionMeter blendshapes={blendshapes} />
                </div>

            </div>
        </div>
    );
};

export default FaceAnalyzer;
