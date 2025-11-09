Driver Wellness Monitoring System (DWMS)

A multi-tier driver wellness monitoring simulation to assess fatigue and alertness using real-time sensor metrics and trigger safety protocols.

Project Overview

DWMS monitors four key driver metrics: PERCLOS (eye closure percentage), yawn rate, pedal pressure stability, and heart-rate/HRV. These are fused into a unified Cogni Score (0-100) which determines the driver’s wellness tier. Depending on the tier, various feedback mechanisms are activated (ambient lighting, haptics, voice prompts, pull-over/SOS).

## How to Run This Project

1. **Install Node.js & npm**

   Make sure you have [Node.js](https://nodejs.org/) (which comes with npm) installed.

   ```bash
   node -v
   npm -v
   ```

2. **Install Dependencies**

   In the project directory, install the required packages:

   ```bash
   npm install
   ```

3. **Start the Development Server**

   Usually, you can run:

   ```bash
   npm run dev
   ```
   or
   ```bash
   npm start
   ```

   > Check the `package.json` file for the exact command under the "scripts" section.

4. **Open the App**

   After the server starts, visit the provided local URL (commonly [http://localhost:5173/](http://localhost:5173/) for Vite, or [http://localhost:3000/](http://localhost:3000/) for Create React App) in your browser.

5. **Build for Production (Optional)**

   To create a production build:

   ```bash
   npm run build
   ```

---

If you have any problems or need more details, please check the documentation for the frameworks and libraries used, or open an issue.

(Optional) Configure sensor input sources (camera for PERCLOS/yawns; wearable for HR/HRV; pedal sensor etc.)

Observe the dashboard: sensor values updating → Cogni Score → tier transitions → feedback triggers.


Tier Logic & Responses

Normal Condition (Cogni Score: 0-20)
Driver is alert; no intervention.

Tier 0 (Score ~20-40)
Trigger: PERCLOS > ~20%, 3-4 yawns/min.
Response: Ambient light color change; “Take a coffee break” message.

Tier 1 (Score ~40-60)
Trigger: PERCLOS > ~30%, 5-7 yawns/min.
Response: Gentle haptic feedback from steering wheel.

Tier 2 (Score ~60-80)
Trigger: HRV decreases, pedal pressure stability drops.
Response: Heavy haptics (steering + seat) + voice prompt: “Please take a break now”.

Tier 3 (Score ~80-100)
Trigger: Big heart rate drop or no response (sleeping/passed out).
Response: Red alert light; driver acknowledgement required; if none → auto pull-over animation + SOS call + heavy voice alert.

Sensor Thresholds (Working Values)

PERCLOS: Normal < ~20%; 30%+ indicates fatigue; >70% indicates likely sleep.

Yawn Rate: Normal 3-4/min;  5-7/min moderate; >7/min severe.

Pedal Pressure Stability: Normal >85%; drop to <60% indicates degraded control.

Heart Rate & HRV: Normal ~65-90 bpm, HRV ~10-20 ms. HRV falling below ~5 ms or HR dropping <55 bpm indicates serious risk.

Each sub-score normalized to 0-100 based on its threshold range. The resulting Cogni Score determines the tier and hence the system response.

Architecture & Components

Sensor Simulation Module – generates or captures PERCLOS, yawns, pedal pressure, heart rate metrics.

Cogni Score Engine – fuses metrics, computes score, assigns tier.

Feedback Controller – triggers ambient lighting changes, haptics, voice prompts.

Alert & SOS Handler – for Tier 3 scenarios: driver acknowledgement, pull-over animation, SOS sequence.

Visualization Dashboard – front-panel view of car interior (steering, instrument cluster) showing live values and system states.


Future Enhancements

Integrate real-time camera input for accurate PERCLOS and yawn detection (e.g., via OpenCV/face-landmarks).

Use real wearable heart-rate sensor for live HR/HRV input.

Add IoT/hardware integration for actual ambient lighting, haptic feedback, seat vibration.

Cloud logging of driver sessions and analytics for long-term fatigue patterns.

Expand to multi-driver fleet monitoring with centralized dashboard.
