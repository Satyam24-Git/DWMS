import { Activity, Eye, Gauge, Heart } from 'lucide-react';
import { MonitoringMetrics, THRESHOLDS } from '../types/monitoring';

interface MetricsPanelProps {
  metrics: MonitoringMetrics;
  onMetricChange: (metric: keyof MonitoringMetrics, value: number) => void;
}

const getStatusColor = (value: number, thresholds: { critical?: number; severe?: number; moderate?: number; mild?: number; normal?: number }, isInverse: boolean = false) => {
  if (isInverse) {
    if (value <= (thresholds.critical ?? 0)) return 'text-red-600';
    if (value <= (thresholds.severe ?? 0)) return 'text-orange-600';
    if (value <= (thresholds.moderate ?? 0)) return 'text-yellow-600';
    if (value <= (thresholds.mild ?? 0)) return 'text-yellow-400';
    return 'text-green-600';
  } else {
    if (value >= (thresholds.critical ?? 100)) return 'text-red-600';
    if (value >= (thresholds.severe ?? 100)) return 'text-orange-600';
    if (value >= (thresholds.moderate ?? 100)) return 'text-yellow-600';
    if (value >= (thresholds.mild ?? 100)) return 'text-yellow-400';
    return 'text-green-600';
  }
};

export default function MetricsPanel({ metrics, onMetricChange }: MetricsPanelProps) {
  const hrv = metrics.hrv ?? 10;
  const inactivityTime = metrics.inactivityTime ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-700">PERCLOS (%)</span>
        </div>
        <div className={`text-3xl font-bold ${getStatusColor(metrics.perclos, THRESHOLDS.perclos)}`}>
          {metrics.perclos.toFixed(1)}
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="0.5"
          value={metrics.perclos}
          onChange={(e) => onMetricChange('perclos', parseFloat(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-700">Yawn Rate (/min)</span>
        </div>
        <div className={`text-3xl font-bold ${getStatusColor(metrics.yawnRate, THRESHOLDS.yawnRate)}`}>
          {metrics.yawnRate.toFixed(2)}
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={metrics.yawnRate}
          onChange={(e) => onMetricChange('yawnRate', parseFloat(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-red-600" />
          <span className="font-semibold text-gray-700">Heart Rate (bpm)</span>
        </div>
        <div className={`text-3xl font-bold ${getStatusColor(metrics.heartRate, THRESHOLDS.heartRate.normal, true)}`}>
          {metrics.heartRate.toFixed(0)}
        </div>
        <input
          type="range"
          min="40"
          max="120"
          value={metrics.heartRate}
          onChange={(e) => onMetricChange('heartRate', parseFloat(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-5 h-5 text-orange-600" />
          <span className="font-semibold text-gray-700">Pedal Pressure (%)</span>
        </div>
        <div className={`text-3xl font-bold ${getStatusColor(metrics.pedalPressure, THRESHOLDS.pedalPressure, true)}`}>
          {metrics.pedalPressure.toFixed(0)}
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={metrics.pedalPressure}
          onChange={(e) => onMetricChange('pedalPressure', parseFloat(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-pink-600" />
          <span className="font-semibold text-gray-700">HRV (ms)</span>
        </div>
        <div className={`text-3xl font-bold ${getStatusColor(hrv, THRESHOLDS.hrv, true)}`}>
          {hrv.toFixed(1)}
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="0.1"
          value={hrv}
          onChange={(e) => onMetricChange('hrv', parseFloat(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-700">Inactivity (sec)</span>
        </div>
        <div className={`text-3xl font-bold ${inactivityTime > 10 ? 'text-red-600' : inactivityTime > 5 ? 'text-orange-600' : 'text-green-600'}`}>
          {inactivityTime}
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={inactivityTime}
          onChange={(e) => onMetricChange('inactivityTime', parseFloat(e.target.value))}
          className="w-full mt-2"
        />
      </div>
    </div>
  );
}
