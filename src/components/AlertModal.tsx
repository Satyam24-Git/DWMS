import { AlertTriangle, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AlertModalProps {
  show: boolean;
  onAcknowledge: () => void;
  onTimeout: () => void;
}

export default function AlertModal({ show, onAcknowledge, onTimeout }: AlertModalProps) {
  const [countdown, setCountdown] = useState(10);
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    if (show && !pulling) {
      setCountdown(10);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setPulling(true);
            onTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [show, pulling, onTimeout]);

  useEffect(() => {
    if (show && !pulling) {
      const audio = new Audio();
      audio.play().catch(() => {});
    }
  }, [show, pulling]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-red-600 bg-opacity-95 flex items-center justify-center z-50 animate-pulse">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
        {!pulling ? (
          <>
            <div className="flex items-center justify-center mb-6">
              <AlertTriangle className="w-24 h-24 text-red-600 animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-center text-red-600 mb-4">
              CRITICAL ALERT
            </h2>
            <p className="text-center text-gray-800 text-lg mb-6 font-semibold">
              Driver wellness compromised. Please acknowledge if you are alert!
            </p>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-red-600">{countdown}</div>
              <div className="text-sm text-gray-600">seconds to acknowledge</div>
            </div>
            <button
              onClick={onAcknowledge}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
            >
              I AM ALERT
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center mb-6">
              <Phone className="w-24 h-24 text-red-600 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-center text-red-600 mb-4">
              EMERGENCY PROTOCOL
            </h2>
            <div className="space-y-4 text-center">
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="text-lg font-bold text-red-800">Initiating Auto Pull Over</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg">
                <p className="text-lg font-bold text-orange-800">Hazard Lights Activated</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg">
                <p className="text-lg font-bold text-yellow-800">Contacting Emergency Services</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg flex items-center justify-center gap-2">
                <Phone className="w-6 h-6 text-blue-800 animate-bounce" />
                <p className="text-lg font-bold text-blue-800">SOS Call in Progress</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
