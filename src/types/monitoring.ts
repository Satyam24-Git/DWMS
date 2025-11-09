export interface MonitoringMetrics {
  perclos: number;
  yawnRate: number;
  heartRate: number;
  pedalPressure: number;
  hrv?: number;
  previousHeartRate?: number;
  inactivityTime?: number;
}

export interface AlertTier {
  tier: number;
  cogniScore: number;
  alertLevel: 'normal' | 'warning' | 'caution' | 'critical' | 'emergency';
  actions: string[];
  triggers: string[];
}

export interface SensorThresholds {
  perclos: {
    normal: number;
    mild: number;
    moderate: number;
    severe: number;
    critical: number;
  };
  yawnRate: {
    normal: number;
    mild: number;
    moderate: number;
    severe: number;
    critical: number;
  };
  pedalPressure: {
    normal: number;
    slight: number;
    delayed: number;
    sluggish: number;
    critical: number;
  };
  heartRate: {
    normal: { min: number; max: number };
    fatigue: number;
    severe: number;
    critical: number;
  };
  hrv: {
    normal: number;
    fatigue: number;
    moderate: number;
    severe: number;
    critical: number;
  };
}

export const THRESHOLDS: SensorThresholds = {
  perclos: {
    normal: 20,
    mild: 30,
    moderate: 50,
    severe: 70,
    critical: 80
  },
  yawnRate: {
    normal: 0.5,
    mild: 1,
    moderate: 2,
    severe: 3,
    critical: 4
  },
  pedalPressure: {
    normal: 85,
    slight: 70,
    delayed: 55,
    sluggish: 40,
    critical: 20
  },
  heartRate: {
    normal: { min: 65, max: 90 },
    fatigue: 60,
    severe: 55,
    critical: 50
  },
  hrv: {
    normal: 10,
    fatigue: 8,
    moderate: 5,
    severe: 3,
    critical: 2
  }
};

export const calculateCogniScore = (metrics: MonitoringMetrics): { score: number; triggers: string[] } => {
  let score = 0;
  const triggers: string[] = [];

  const hrv = metrics.hrv ?? 10;
  const previousHeartRate = metrics.previousHeartRate ?? metrics.heartRate;
  const inactivityTime = metrics.inactivityTime ?? 0;

  if (metrics.perclos >= THRESHOLDS.perclos.critical) {
    score += 35;
    triggers.push('PERCLOS critical (>80%)');
  } else if (metrics.perclos >= THRESHOLDS.perclos.severe) {
    score += 30;
    triggers.push('PERCLOS severe (70-80%)');
  } else if (metrics.perclos >= THRESHOLDS.perclos.moderate) {
    score += 20;
    triggers.push('PERCLOS moderate (50-70%)');
  } else if (metrics.perclos >= THRESHOLDS.perclos.mild) {
    score += 10;
    triggers.push('PERCLOS mild (30-50%)');
  } else if (metrics.perclos >= THRESHOLDS.perclos.normal) {
    score += 5;
    triggers.push('PERCLOS elevated (20-30%)');
  }

  if (metrics.yawnRate >= THRESHOLDS.yawnRate.critical) {
    score += 32;
    triggers.push('Yawn rate critical (>3/min)');
  } else if (metrics.yawnRate >= THRESHOLDS.yawnRate.severe) {
    score += 25;
    triggers.push('Yawn rate severe (2-3/min)');
  } else if (metrics.yawnRate >= THRESHOLDS.yawnRate.moderate) {
    score += 15;
    triggers.push('Yawn rate moderate (1-2/min)');
  } else if (metrics.yawnRate >= THRESHOLDS.yawnRate.mild) {
    score += 8;
    triggers.push('Yawn rate mild (0.5-1/min)');
  }

  if (metrics.pedalPressure <= THRESHOLDS.pedalPressure.critical) {
    score += 30;
    triggers.push('Pedal pressure critical (<20%)');
  } else if (metrics.pedalPressure <= THRESHOLDS.pedalPressure.sluggish) {
    score += 20;
    triggers.push('Pedal pressure sluggish (40-55%)');
  } else if (metrics.pedalPressure <= THRESHOLDS.pedalPressure.delayed) {
    score += 12;
    triggers.push('Pedal pressure delayed (55-70%)');
  } else if (metrics.pedalPressure <= THRESHOLDS.pedalPressure.slight) {
    score += 5;
    triggers.push('Pedal pressure slight distraction (70-85%)');
  }

  if (metrics.heartRate <= THRESHOLDS.heartRate.critical) {
    score += 28;
    triggers.push(`Heart rate critical (<${THRESHOLDS.heartRate.critical} bpm)`);
  } else if (metrics.heartRate <= THRESHOLDS.heartRate.severe) {
    score += 22;
    triggers.push(`Heart rate severe (${THRESHOLDS.heartRate.severe}-${THRESHOLDS.heartRate.critical} bpm)`);
  } else if (metrics.heartRate <= THRESHOLDS.heartRate.fatigue) {
    score += 15;
    triggers.push(`Heart rate fatigue (${THRESHOLDS.heartRate.fatigue}-${THRESHOLDS.heartRate.severe} bpm)`);
  }

  const heartRateDrop = previousHeartRate - metrics.heartRate;
  if (heartRateDrop > 20) {
    score += 35;
    triggers.push(`Sudden heart rate drop (>${heartRateDrop} bpm)`);
  }

  if (hrv <= THRESHOLDS.hrv.critical) {
    score += 32;
    triggers.push(`HRV critical (<${THRESHOLDS.hrv.critical} ms)`);
  } else if (hrv <= THRESHOLDS.hrv.severe) {
    score += 25;
    triggers.push(`HRV severe (<${THRESHOLDS.hrv.severe} ms)`);
  } else if (hrv <= THRESHOLDS.hrv.moderate) {
    score += 18;
    triggers.push(`HRV moderate (<${THRESHOLDS.hrv.moderate} ms)`);
  } else if (hrv <= THRESHOLDS.hrv.fatigue) {
    score += 10;
    triggers.push(`HRV fatigue (<${THRESHOLDS.hrv.fatigue} ms)`);
  }

  if (inactivityTime > 10) {
    score += 30;
    triggers.push(`No input for ${inactivityTime}+ seconds`);
  }

  return { score: Math.min(score, 100), triggers };
};

export const getTierFromCogniScore = (score: number, triggers: string[] = []): AlertTier => {
  if (score >= 70) {
    return {
      tier: 3,
      cogniScore: score,
      alertLevel: 'emergency',
      actions: ['RED ALERT', 'Driver Acknowledgement Required', 'Auto Pull Over', 'SOS Call'],
      triggers
    };
  } else if (score >= 50) {
    return {
      tier: 2,
      cogniScore: score,
      alertLevel: 'critical',
      actions: ['Heavy Haptics', 'Voice Prompt', 'Take a Break Now'],
      triggers
    };
  } else if (score >= 30) {
    return {
      tier: 1,
      cogniScore: score,
      alertLevel: 'caution',
      actions: ['Gentle Haptics', 'Steering Alert', 'Stay Alert'],
      triggers
    };
  } else if (score >= 15) {
    return {
      tier: 0,
      cogniScore: score,
      alertLevel: 'warning',
      actions: ['Ambient Light Change', 'Coffee Break Suggestion'],
      triggers
    };
  }

  return {
    tier: -1,
    cogniScore: score,
    alertLevel: 'normal',
    actions: ['System Active'],
    triggers: []
  };
};
