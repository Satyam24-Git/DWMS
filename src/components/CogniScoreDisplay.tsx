import { AlertTier } from '../types/monitoring';

interface CogniScoreDisplayProps {
  alertTier: AlertTier;
}

export default function CogniScoreDisplay({ alertTier }: CogniScoreDisplayProps) {
  const getColorByTier = () => {
    switch (alertTier.alertLevel) {
      case 'emergency': return 'bg-red-600';
      case 'critical': return 'bg-orange-600';
      case 'caution': return 'bg-yellow-500';
      case 'warning': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const getTextColor = () => {
    switch (alertTier.alertLevel) {
      case 'emergency': return 'text-red-600';
      case 'critical': return 'text-orange-600';
      case 'caution': return 'text-yellow-600';
      case 'warning': return 'text-blue-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-2xl">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">CogniScore</h2>
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#e5e7eb"
              strokeWidth="16"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke={alertTier.alertLevel === 'emergency' ? '#dc2626' :
                     alertTier.alertLevel === 'critical' ? '#ea580c' :
                     alertTier.alertLevel === 'caution' ? '#eab308' :
                     alertTier.alertLevel === 'warning' ? '#3b82f6' : '#22c55e'}
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${(alertTier.cogniScore / 100) * 502} 502`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getTextColor()}`}>
                {alertTier.cogniScore.toFixed(0)}
              </div>
              <div className="text-sm text-gray-500">/ 100</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Alert Level:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getColorByTier()}`}>
            {alertTier.tier >= 0 ? `TIER ${alertTier.tier}` : 'NORMAL'}
          </span>
        </div>

        {alertTier.triggers.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Active Triggers:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {alertTier.triggers.map((trigger, index) => (
                <div
                  key={index}
                  className="text-xs bg-red-50 px-2 py-1 rounded text-red-700 font-medium border border-red-200"
                >
                  {trigger}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Active Actions:</div>
          <div className="space-y-1">
            {alertTier.actions.map((action, index) => (
              <div
                key={index}
                className="text-xs bg-gray-100 px-3 py-2 rounded text-gray-700 font-medium"
              >
                {action}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
