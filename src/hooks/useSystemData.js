import { useState, useEffect } from 'react';

const useSystemData = () => {
  const [systemData, setSystemData] = useState({
    attitude: null,
    battery: {
      level: 78,
      voltage: 11.8,
      current: 4.2,
      capacityUsed: 1240,
      timeRemaining: 22
    },
    communication: {
      status: 'Connected',
      signalStrength: 92,
      linkQuality: 98,
      dataRate: 57.6,
      packetLoss: 0.2
    },
    systemHealth: {
      status: 'Normal',
      cpuLoad: 24,
      memoryUsage: 32,
      temperature: 32,
      storage: 45
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch ATTITUDE data
        const attitudeResponse = await fetch('/params/ATTITUDE.json');
        const attitudeData = await attitudeResponse.json();

        // Update system data with real values
        setSystemData(prev => ({
          ...prev,
          attitude: attitudeData,
        }));
      } catch (error) {
        console.error('Error fetching system data:', error);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling interval
    const interval = setInterval(fetchData, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return systemData;
};

export default useSystemData; 