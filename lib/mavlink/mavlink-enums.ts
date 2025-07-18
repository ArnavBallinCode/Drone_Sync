export enum MAV_CMD {
  MAV_CMD_PREFLIGHT_CALIBRATION = 241,
  MAV_CMD_START_RX_PAIR = 500,
}

export enum CALIBRATION_STATUS {
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CALIBRATION_STEP {
  WAITING = 'waiting',
  ORIENTATION_DETECTED = 'orientation_detected',
  COLLECTING_DATA = 'collecting_data',
  CALCULATING = 'calculating',
}

// Calibration parameter mapping
export const CALIBRATION_PARAMS = {
  GYRO: 1,
  MAGNETOMETER: 2,
  GROUND_PRESSURE: 3,
  RADIO: 4,
  ACCELEROMETER: 5,
  LEVEL: 6,
  ESC: 7,
  AIRSPEED: 8,
} as const 