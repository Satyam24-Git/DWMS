import socket
import json
import time
import random

# --- Constants ---
HOST = '127.0.0.1'  # Server IP (localhost)
PORT = 65432       # Port to listen on

# --- State ---
# This holds the simple, deterministic logic of the safety core.
# It is designed to be auditable, as per ASIL-D principles.
current_tier = "TIER_NORMAL"
last_tier_time = time.time()
debounce_time = 2.0 # Wait 2 seconds before changing tiers to prevent flickering

# --- Simulator Functions (Mocking other sensors) ---

def simulate_physiological_data():
    """
    Simulates the ECG/HRV sensor input.
    In a real Versal, this would come from an ADC/I2C peripheral.
    """
    hrv = random.uniform(40.0, 80.0)
    hrv_status = "OK"

    # Randomly simulate a failure or anomaly (e.g., driver incapacitation)
    if random.random() < 0.01: # 1% chance of anomaly
        hrv_status = "ANOMALY_DETECTED"
        hrv = 0.0
    elif random.random() < 0.005: # 0.5% chance of sensor failure
        hrv_status = "FAILURE" # e.g., sensor detached
        hrv = -1.0
        
    return {"hrv": hrv, "hrv_status": hrv_status}

def simulate_vehicle_dynamics():
    """
    Simulates the Vehicle CAN Bus data (Steering/Pedal).
    In a real Versal, this would come from the CAN-FD controller.
    """
    steering_rate = random.uniform(-5.0, 5.0)
    pedal_input = random.uniform(0.3, 0.7) # Normalized normal driving
    input_status = "NORMAL"

    # Simulate erratic steering OR pedal
    if random.random() < 0.05:
        if random.random() > 0.5:
            steering_rate = random.choice([-20.0, 20.0]) # Jerk
        else:
            pedal_input = random.choice([0.0, 1.0]) # Abruptly off/on pedal
        input_status = "ERRATIC"
        
    # Simulate no input (e.g., hands off wheel, foot off pedal)
    if random.random() < 0.02:
        steering_rate = 0.0
        pedal_input = 0.0
        input_status = "ZERO_INPUT"

    return {"steering_rate": steering_rate, "pedal_input": pedal_input, "input_status": input_status}


def run_4_tier_safety_logic(vision, physio, vehicle):
    """
    This is the CORE FUSION LOGIC of the CogniShield project.
    It runs the 4-Tier Safety Protocol based on the PPT.
    This logic is simple, deterministic, and auditable (ASIL-D principle).
    
    It checks for cross-modal plausibility.
    """
    
    # --- Tier 3: Microsleep / Incapacitation (Highest Priority) ---
    # Trigger: PERCLOS > 80% AND Lack of Input
    # Trigger: ECG sensor failure (Incapacitation)
    
    if physio["hrv_status"] == "FAILURE" or physio["hrv_status"] == "ANOMALY_DETECTED":
        return "TIER_3_INCAPACITATION"
        
    if vision["perclos"] > 0.15 and vehicle["input_status"] == "ZERO_INPUT":
        # PLAUSIBILITY CHECK: High PERCLOS is confirmed by zero vehicle input.
        return "TIER_3_MICROSLEEP"

    # --- Tier 2: High Drowsiness / Stress / Distraction ---
    # Trigger: High PERCLOS (60-80%)
    # Trigger: Erratic Steering Correction
    # Trigger: High Head Turns (Gaze Distraction)
    
    if vision["perclos"] > 0.12:
        # High PERCLOS is a strong indicator
        return "TIER_2_HIGH_DROWSINESS"
        
    if vehicle["input_status"] == "ERRATIC":
        # PLAUSIBILITY CHECK: Erratic steering is a strong indicator,
        # even if PERCLOS is momentarily low.
        return "TIER_2_ERRATIC_STEERING"
        
    if vision["gaze_distraction"]:
        return "TIER_2_DISTRACTION"

    # --- Tier 1: Early Fatigue / Mild Cognitive Dip ---
    # Trigger: Low sustained PERCLOS (40-50%)
    # Trigger: Drop in HRV (Simulated by ANOMALY)
    
    if vision["perclos"] > 0.075:
        return "TIER_1_EARLY_FATIGUE"
        
    if physio["hrv_status"] == "ANOMALY_DETECTED": # Using this as a proxy for HRV dip
        return "TIER_1_PHYSIO_DIP"

    # --- Tier 0: Monotony / Boredom ---
    # Trigger: Yawn Frequency
    # Trigger: Low steering rate (not simulated here, but yawn is)
    
    if vision["yawn_freq"] > 0:
        return "TIER_0_MONOTONY"

    # --- Default: Normal ---
    return "TIER_NORMAL"


def main():
    global current_tier, last_tier_time

    print("[SAFETY CORE] Initializing...")
    print("[SAFETY CORE] Running on ASIL-D simulated core.")
    print("[SAFETY CORE] Awaiting connection from AI Perception Core (Jetson)...")

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((HOST, PORT))
        s.listen()
        
        conn, addr = s.accept()
        with conn:
            print(f"[SAFETY CORE] AI Core connected from {addr}")
            
            while True:
                # 1. Receive data from AI Core (Jetson)
                data = conn.recv(1024)
                if not data:
                    print("[SAFETY CORE] AI Core disconnected. Shutting down.")
                    break
                
                try:
                    # Parse the vision data
                    packet = json.loads(data.decode('utf-8'))
                    vision_data = packet.get("vision_data", {})
                    
                    # 2. Poll other sensors (Simulated)
                    physio_data = simulate_physiological_data()
                    vehicle_data = simulate_vehicle_dynamics()
                    
                    # 3. Run the deterministic safety logic
                    new_tier = run_4_tier_safety_logic(vision_data, physio_data, vehicle_data)
                    
                    # 4. Debounce and output the final, unified state
                    if new_tier != current_tier and (time.time() - last_tier_time) > debounce_time:
                        current_tier = new_tier
                        last_tier_time = time.time()
                        
                        # This PRINT statement is the "output" of the prototype.
                        # In the real car, this would be a CAN-FD message.
                        print("---")
                        print(f"[COGNISHIELD STATE @ {time.strftime('%H:%M:%S')}]")
                        print(f"  > FINAL TIER: {current_tier}")
                        print(f"  > INTERVENTION: Triggering {current_tier} protocol...")
                        print("---")
                        print("  [Sensor Data]")
                        print(f"    [Vision]: PERCLOS={vision_data.get('perclos', 0):.2f}, Yawn={vision_data.get('yawn_freq', 0)}, Gaze={vision_data.get('head_pose', 'N/A')}")
                        print(f"    [Physio]: HRV_Status={physio_data['hrv_status']}")
                        print(f"    [Vehicle]: Status={vehicle_data['input_status']}, Pedal={vehicle_data['pedal_input']:.2f}, Steering={vehicle_data['steering_rate']:.2f}")
                        print("\n")


                except json.JSONDecodeError:
                    print("[SAFETY CORE] Received malformed data.")
                except Exception as e:
                    print(f"[SAFETY CORE] Error: {e}")
                    break

if __name__ == '__main__':
    main()