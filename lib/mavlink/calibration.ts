import { MAV_CMD } from './mavlink-enums'

export class CalibrationService {
  private ws: WebSocket | null = null;
  private statusCallback: ((status: string, progress?: number) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(private wsUrl: string) {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('Connected to calibration server');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.statusCallback) {
            // Extract progress from status message if available
            let progress: number | undefined;
            if (data.progress !== undefined) {
              progress = data.progress;
            } else if (data.status.includes('Progress:')) {
              const match = data.status.match(/Progress: (\d+)%/);
              if (match) {
                progress = parseInt(match[1]);
              }
            }
            this.statusCallback(data.status, progress);
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('Disconnected from calibration server');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('Connection error:', e);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private ensureConnection(): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      this.statusCallback?.('WebSocket connection error. Please refresh the page.', 0);
      return false;
    }
    return true;
  }

  onCalibrationStatus(callback: (status: string, progress?: number) => void) {
    this.statusCallback = callback;
  }

  startCalibration(command: string) {
    if (this.ensureConnection()) {
      this.ws!.send(JSON.stringify({ command }));
    }
  }
}