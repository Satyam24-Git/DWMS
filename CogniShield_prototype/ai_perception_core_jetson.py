import cv2
import mediapipe as mp 
import numpy as np
import socket
import json
import time
from scipy.spatial import distance as dist

# --- Constants ---
# Landmark indices from MediaPipe Face Mesh for eyes and mouth
LEFT_EYE_LANDMARKS = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
RIGHT_EYE_LANDMARKS = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
MOUTH_LANDMARKS = [61, 291, 0, 17, 267, 269, 270, 409, 405, 314, 317, 318, 324, 308, 402, 310, 311, 312, 13, 14, 78, 80, 81, 82, 84, 87, 88, 91, 95, 146, 178, 181, 185, 191]

# PERCLOS settings
PERCLOS_WINDOW_SIZE = 60  # Number of frames to average for PERCLOS (e.g., 2 seconds at 30fps)

# Yawn settings
YAWN_MOUTH_AR_THRESH = 0.35  # Threshold for mouth aspect ratio to detect a yawn

# Communication settings
SAFETY_CORE_HOST = '127.0.0.1'  # The Versal's IP (localhost for simulation)
SAFETY_CORE_PORT = 65432       # Port to send data to

# --- Global State Variables ---
ear_threshold = 0.2  # Default, will be calibrated
ear_history = []
calibration_frames = 150 # Number of frames for calibration (e.g., 5 seconds)

# --- Helper Functions ---

def calculate_ear(eye_landmarks, frame_shape):
    """Calculates the Eye Aspect Ratio (EAR) for a single eye."""
    # Convert landmarks to (x, y) coordinates
    coords = np.array([(eye_landmarks[i].x * frame_shape[1], eye_landmarks[i].y * frame_shape[0]) for i in range(len(eye_landmarks))])

    # Extract vertical landmarks (simplified for EAR)
    v1 = dist.euclidean(coords[2], coords[14]) # Points 381, 385 for left
    v2 = dist.euclidean(coords[4], coords[12]) # Points 374, 386 for left

    # Extract horizontal landmarks
    h = dist.euclidean(coords[0], coords[8]) # Points 362, 263 for left
    
    # Calculate EAR
    ear = (v1 + v2) / (2.0 * h)
    return ear

def calculate_mouth_ar(mouth_landmarks, frame_shape):
    """Calculates the Mouth Aspect Ratio (MAR) for yawn detection."""
    coords = np.array([(mouth_landmarks[i].x * frame_shape[1], mouth_landmarks[i].y * frame_shape[0]) for i in range(len(mouth_landmarks))])
    
    # Vertical landmarks (simplified)
    v = dist.euclidean(coords[13], coords[14]) # Points 13, 14 (top/bottom lip)
    
    # Horizontal landmarks
    h = dist.euclidean(coords[0], coords[16]) # Points 61, 291 (corners)

    mar = v / h
    return mar

def get_head_gaze(face_3d, face_2d, frame_shape):
    """
    Estimates gaze direction based on head pose.
    This is a simplified model for the prototype.
    """
    h, w, _ = frame_shape
    focal_length = w
    cam_matrix = np.array([[focal_length, 0, w / 2],
                           [0, focal_length, h / 2],
                           [0, 0, 1]])
    
    # Solve for pose
    try:
        success, rot_vec, trans_vec = cv2.solvePnP(face_3d, face_2d, cam_matrix, np.zeros((4, 1), dtype=np.float64))
        
        # Project 3D nose tip to 2D
        (nose_end_point_2D, _) = cv2.projectPoints(np.array([(0.0, 0.0, 1000.0)]), rot_vec, trans_vec, cam_matrix, np.zeros((4, 1), dtype=np.float64))
        
        # Get Euler angles
        rot_mat, _ = cv2.Rodrigues(rot_vec)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rot_mat)
        
        # angles[0] = pitch (up/down), angles[1] = yaw (left/right)
        pitch = angles[0]
        yaw = angles[1]

        # Determine gaze
        if yaw > 15:
            gaze = "Right"
        elif yaw < -15:
            gaze = "Left"
        elif pitch > 10:
            gaze = "Down"
        elif pitch < -10:
            gaze = "Up"
        else:
            gaze = "Forward"
            
        return gaze, (int(nose_end_point_2D[0][0][0]), int(nose_end_point_2D[0][0][1]))
    
    except Exception:
        return "Forward", (0,0)


def calibrate_ear(cap, face_mesh):
    """
    Calibrates the driver-specific EAR threshold.
    As per the PPT feature list.
    """
    global ear_threshold
    print(f"[AI CORE] Starting Calibration... Look forward and blink normally for {calibration_frames // 30} seconds.")
    
    ear_samples = []
    
    for _ in range(calibration_frames):
        success, frame = cap.read()
        if not success:
            continue
            
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(frame_rgb)
        
        if results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0]
            
            # Get landmarks for eyes
            left_eye = [face_landmarks.landmark[i] for i in LEFT_EYE_LANDMARKS]
            right_eye = [face_landmarks.landmark[i] for i in RIGHT_EYE_LANDMARKS]

            ear_left = calculate_ear(left_eye, frame.shape)
            ear_right = calculate_ear(right_eye, frame.shape)
            ear = (ear_left + ear_right) / 2.0
            ear_samples.append(ear)

        cv2.imshow('CogniShield - AI Core Calibration', frame)
        cv2.waitKey(5)

    cv2.destroyWindow('CogniShield - AI Core Calibration')

    # Calculate threshold: Use a value slightly lower than the average 'open' EAR
    # This is a simplified calibration. A robust one would analyze the distribution.
    if ear_samples:
        avg_ear = np.mean(ear_samples)
        ear_threshold = avg_ear * 0.7  # Set threshold to 70% of average open EAR
        print(f"[AI CORE] Calibration Complete. New EAR Threshold: {ear_threshold:.2f}")
    else:
        print("[AI CORE] Calibration FAILED. Using default threshold.")


def main():
    global ear_history
    
    # 1. Initialize MediaPipe
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5)

    # 2. Initialize Video Capture
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[AI CORE] Error: Cannot open webcam.")
        return

    # 3. Calibrate EAR
    calibrate_ear(cap, face_mesh)

    # 4. Connect to Safety Core (Versal)
    print("[AI CORE] Attempting to connect to Safety Core (Versal)...")
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((SAFETY_CORE_HOST, SAFETY_CORE_PORT))
        print("[AI CORE] Connected to Safety Core.")
    except Exception as e:
        print(f"[AI CORE] Failed to connect to Safety Core: {e}")
        cap.release()
        return

    # 3D model points for head pose
    face_3d = np.array([
        (0.0, 0.0, 0.0),            # Nose tip
        (0.0, -330.0, -65.0),       # Chin
        (-225.0, 170.0, -135.0),    # Left eye left corner
        (225.0, 170.0, -135.0),     # Right eye right corner
        (-150.0, -150.0, -125.0),   # Left Mouth corner
        (150.0, -150.0, -125.0)     # Right mouth corner
    ], dtype=np.float64)

    # Main processing loop
    while cap.isOpened():
        start_time = time.time()
        success, frame = cap.read()
        if not success:
            break

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame.flags.writeable = False # Performance optimization
        results = face_mesh.process(frame_rgb)
        frame.flags.writeable = True

        h, w, _ = frame.shape
        perclos = 0.0
        yawn_freq = 0
        gaze = "Forward"
        
        if results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0]

            # --- 1. Drowsiness Detection (PERCLOS) ---
            left_eye = [face_landmarks.landmark[i] for i in LEFT_EYE_LANDMARKS]
            right_eye = [face_landmarks.landmark[i] for i in RIGHT_EYE_LANDMARKS]

            ear_left = calculate_ear(left_eye, frame.shape)
            ear_right = calculate_ear(right_eye, frame.shape)
            ear = (ear_left + ear_right) / 2.0
            
            # Update history and calculate PERCLOS
            is_closed = 1 if ear < ear_threshold else 0
            ear_history.append(is_closed)
            if len(ear_history) > PERCLOS_WINDOW_SIZE:
                ear_history.pop(0)
            
            perclos = np.mean(ear_history) # PERCLOS is % of time eyes are closed

            # --- 2. Drowsiness Detection (Yawn) ---
            mouth = [face_landmarks.landmark[i] for i in MOUTH_LANDMARKS]
            mar = calculate_mouth_ar(mouth, frame.shape)
            if mar > YAWN_MOUTH_AR_THRESH:
                yawn_freq = 1 # Simplified to "is yawning"

            # --- 3. Distraction Detection (Gaze/Pose) ---
            # 2D image points
            face_2d = np.array([
                (face_landmarks.landmark[1].x * w, face_landmarks.landmark[1].y * h),       # Nose tip
                (face_landmarks.landmark[152].x * w, face_landmarks.landmark[152].y * h),   # Chin
                (face_landmarks.landmark[263].x * w, face_landmarks.landmark[263].y * h),   # Left eye left corner
                (face_landmarks.landmark[33].x * w, face_landmarks.landmark[33].y * h),     # Right eye right corner
                (face_landmarks.landmark[287].x * w, face_landmarks.landmark[287].y * h),   # Left Mouth corner
                (face_landmarks.landmark[57].x * w, face_landmarks.landmark[57].y * h)      # Right mouth corner
            ], dtype=np.float64)

            gaze, nose_tip_2d = get_head_gaze(face_3d, face_2d, frame.shape)
            
            # Draw overlays for demo
            p1 = (int(face_2d[0][0]), int(face_2d[0][1]))
            cv2.line(frame, p1, nose_tip_2d, (255, 0, 0), 2)
            cv2.putText(frame, f"EAR: {ear:.2f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, f"PERCLOS: {perclos:.2f}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, f"Gaze: {gaze}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        # --- 4. Package and Send Data to Safety Core ---
        vision_packet = {
            "perclos": perclos,
            "yawn_freq": yawn_freq,
            "gaze_distraction": gaze != "Forward",
            "head_pose": gaze # Using gaze as a proxy for pose
        }
        
        try:
            # Create the final packet, encapsulating it as vision data
            data_to_send = {"vision_data": vision_packet}
            s.sendall(json.dumps(data_to_send).encode('utf-8'))
        except Exception as e:
            print(f"[AI CORE] Connection lost to Safety Core: {e}")
            break

        # --- 5. Display ---
        fps = 1 / (time.time() - start_time)
        cv2.putText(frame, f"FPS: {int(fps)}", (w - 100, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        cv2.imshow('CogniShield - AI Perception Core (Jetson)', frame)
        
        if cv2.waitKey(5) & 0xFF == 27: # Press ESC to exit
            break

    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    s.close()
    face_mesh.close()
    print("[AI CORE] Shutdown complete.")

if __name__ == '__main__':
    main()