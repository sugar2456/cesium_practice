import { FitbitDataPoint, FitbitTracks } from "../types/fitbit-datapoint";

export async function getFitbitData(path: string): Promise<FitbitTracks> {
    const res = await fetch(path);
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const dataTracks: FitbitTracks = [];
    const tracks = xmlDoc.getElementsByTagName("Track");
    for (let i = 0; i < tracks.length; i++) {
        const trackPoints = tracks[i].getElementsByTagName("Trackpoint");
        console.log(`Processing Track ${i + 1} with ${trackPoints.length} points`);
        const dataPoints: FitbitDataPoint[] = [];
        for (let j = 0; j < trackPoints.length; j++) {
            const trackPoint = trackPoints[j];
            const dataPoint: FitbitDataPoint = {
                position: {
                    latitude: parseFloat(trackPoint.getElementsByTagName("LatitudeDegrees")[0]?.textContent || "0"),
                    longitude: parseFloat(trackPoint.getElementsByTagName("LongitudeDegrees")[0]?.textContent || "0"),
                },
                altitude: parseFloat(trackPoint.getElementsByTagName("AltitudeMeters")[0]?.textContent || "0"),
                distance: parseFloat(trackPoint.getElementsByTagName("DistanceMeters")[0]?.textContent || "0"),
                heartRate: parseFloat(trackPoint.getElementsByTagName("HeartRateBpm")[0]?.textContent || "0"),
                timestamp: trackPoint.getElementsByTagName("Time")[0]?.textContent || "",
            };
            dataPoints.push(dataPoint);
        }
        dataTracks.push({
            trackId: i,
            points: dataPoints
        });
    }
    return dataTracks;
}