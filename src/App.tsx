import { useState, useEffect } from 'react';
import MetricsPanel from './components/MetricsPanel';
import CogniScoreDisplay from './components/CogniScoreDisplay';
import AlertModal from './components/AlertModal';
import { MonitoringMetrics, calculateCogniScore, getTierFromCogniScore } from './types/monitoring';

function App() {
  const [metrics, setMetrics] = useState<MonitoringMetrics>({
    perclos: 15,
    yawnRate: 0.3,
    heartRate: 72,
    pedalPressure: 85,
    hrv: 15,
    previousHeartRate: 72,
    inactivityTime: 0
  });

  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [ambientColor, setAmbientColor] = useState('#1f2937');

  const { score: cogniScore, triggers } = calculateCogniScore(metrics);
  const alertTier = getTierFromCogniScore(cogniScore, triggers);

  const handleMetricChange = (metric: keyof MonitoringMetrics, value: number) => {
    setMetrics(prev => ({ ...prev, [metric]: value }));
  };

  useEffect(() => {
    if (alertTier.tier === 3) {
      setShowEmergencyAlert(true);
    } else {
      setShowEmergencyAlert(false);
    }

    switch (alertTier.alertLevel) {
      case 'emergency':
        setAmbientColor('#dc2626');
        break;
      case 'critical':
        setAmbientColor('#ea580c');
        break;
      case 'caution':
        setAmbientColor('#eab308');
        break;
      case 'warning':
        setAmbientColor('#3b82f6');
        break;
      default:
        setAmbientColor('#1f2937');
    }
  }, [alertTier]);

  const getHapticLevel = () => {
    if (alertTier.tier === 2) return 'heavy';
    if (alertTier.tier === 1) return 'gentle';
    return 'none';
  };

  const handleAcknowledge = () => {
    setShowEmergencyAlert(false);
    setMetrics({
      perclos: 15,
      yawnRate: 0.3,
      heartRate: 72,
      pedalPressure: 85,
      hrv: 15,
      previousHeartRate: 72,
      inactivityTime: 0
    });
  };

  const handleTimeout = () => {
  };

  const simulateTier = (tier: number) => {
    if (tier === -1) {
      setMetrics({
        perclos: 15,
        yawnRate: 0.3,
        heartRate: 72,
        pedalPressure: 85,
        hrv: 15,
        previousHeartRate: 72,
        inactivityTime: 0
      });
    } else if (tier === 0) {
      setMetrics({
        perclos: 25,
        yawnRate: 0.7,
        heartRate: 75,
        pedalPressure: 78,
        hrv: 12,
        previousHeartRate: 75,
        inactivityTime: 0
      });
    } else if (tier === 1) {
      setMetrics({
        perclos: 35,
        yawnRate: 1.5,
        heartRate: 82,
        pedalPressure: 65,
        hrv: 8,
        previousHeartRate: 82,
        inactivityTime: 2
      });
    } else if (tier === 2) {
      setMetrics({
        perclos: 55,
        yawnRate: 2.5,
        heartRate: 58,
        pedalPressure: 45,
        hrv: 4,
        previousHeartRate: 58,
        inactivityTime: 5
      });
    } else if (tier === 3) {
      setMetrics({
        perclos: 75,
        yawnRate: 3.5,
        heartRate: 42,
        pedalPressure: 15,
        hrv: 1.5,
        previousHeartRate: 65,
        inactivityTime: 12
      });
    }
  };

  return (
    <div
      className="min-h-screen transition-colors duration-1000"
      style={{ backgroundColor: ambientColor }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Driver Wellness Monitoring System</h1>
          <p className="text-white opacity-80">Advanced CogniScore-Based Safety Protocol</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-8 backdrop-blur">
              <div className="flex justify-center mb-6 relative">
                <img
                  src="/src/assets/image.png"
                  alt="Car Dashboard"
                  className="w-full h-auto max-w-lg rounded-lg shadow-2xl"
                  style={{
                    filter: alertTier.tier === 3 ? 'brightness(0.8) drop-shadow(0 0 20px #dc2626)' :
                            alertTier.tier === 2 ? 'brightness(0.9) drop-shadow(0 0 15px #ea580c)' :
                            alertTier.tier === 1 ? 'drop-shadow(0 0 10px #eab308)' :
                            alertTier.tier === 0 ? 'drop-shadow(0 0 8px #3b82f6)' : 'brightness(1)'
                  }}
                />
              </div>

              {alertTier.tier >= 1 && (
                <div className="text-center mt-6">
                  <div className="inline-block bg-white bg-opacity-90 px-6 py-3 rounded-full">
                    <p className="text-lg font-bold text-gray-800">
                      {alertTier.tier === 1 && 'Gentle haptic feedback active'}
                      {alertTier.tier === 2 && 'Heavy haptic feedback and voice prompt'}
                      {alertTier.tier === 3 && 'CRITICAL - Emergency protocol initiated'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            
            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-6 backdrop-blur">
              <h2 className="text-2xl font-bold text-white mb-4">Live Metrics</h2>
              <MetricsPanel metrics={metrics} onMetricChange={handleMetricChange} />
            </div>
          </div>

          <div className="space-y-6">
            <CogniScoreDisplay alertTier={alertTier} />

            </div>
          </div>
        </div>
      </div>

      <AlertModal
        show={showEmergencyAlert}
        onAcknowledge={handleAcknowledge}
        onTimeout={handleTimeout}
      />
    </div>
  );
}

export default App;
