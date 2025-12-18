import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let faceLandmarker = null;
let initPromise = null;

export const createFaceLandmarker = async () => {
    if (faceLandmarker) return faceLandmarker;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: "/models/face_landmarker.task",
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1
            });

            console.log("FaceLandmarker created successfully");
            return faceLandmarker;
        } catch (error) {
            console.error("Error creating FaceLandmarker:", error);
            initPromise = null; // Reset on error so we can try again
            throw error;
        }
    })();

    return initPromise;
};

export const getFaceLandmarker = () => faceLandmarker;
