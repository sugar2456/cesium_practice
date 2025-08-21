export type FitbitDataPoint = {
    position: {
        latitude: number;
        longitude: number;
    };
    altitude: number;
    distance: number;
    heartRate: number;
    timestamp: string;
};

export type FitbitTrack = {
  trackId: number;
  points: FitbitDataPoint[];
};

export type FitbitTracks = FitbitTrack[];
