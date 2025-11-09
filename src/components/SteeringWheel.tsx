interface SteeringWheelProps {
  hapticLevel: 'none' | 'gentle' | 'heavy';
  alertColor: string;
}

export default function SteeringWheel({ hapticLevel, alertColor }: SteeringWheelProps) {
  const hapticAnimation = hapticLevel === 'gentle'
    ? 'animate-pulse'
    : hapticLevel === 'heavy'
    ? 'animate-bounce'
    : '';

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`w-64 h-64 rounded-full border-8 flex items-center justify-center ${hapticAnimation}`}
        style={{
          borderColor: alertColor,
          boxShadow: hapticLevel !== 'none' ? `0 0 30px ${alertColor}` : 'none'
        }}
      >
        <div className="w-56 h-56 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-600"></div>
          </div>
        </div>

        <div className="absolute top-8 w-4 h-16 bg-gray-700 rounded"></div>
        <div className="absolute bottom-8 w-4 h-16 bg-gray-700 rounded"></div>
        <div className="absolute left-8 w-16 h-4 bg-gray-700 rounded"></div>
        <div className="absolute right-8 w-16 h-4 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}
