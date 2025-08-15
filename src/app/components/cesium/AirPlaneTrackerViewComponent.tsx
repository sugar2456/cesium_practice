"use client";
import { useEffect } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";
import flightRowData from './data/flight_data.json';

export default function AirPlaneTrackerView() {
    useEffect(() => {
        window.CESIUM_BASE_URL = "/cesium";
        (async () => {
            const {
                Viewer,
                Ion,
                Terrain,
                Cartesian3,
                Color,
                JulianDate,
                SampledPositionProperty,
                TimeIntervalCollection,
                TimeInterval,
                PathGraphics,
                IonResource,
                VelocityOrientationProperty
            } =
                await import("cesium");

            Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN!;
            const viewer = new Viewer("cesiumContainer", { terrain: Terrain.fromWorldTerrain() });
            const flightData = flightRowData;
            /* Initialize the viewer clock:
              Assume the radar samples are 30 seconds apart, and calculate the entire flight duration based on that assumption.
              Get the start and stop date times of the flight, where the start is the known flight departure time (converted from PST 
                to UTC) and the stop is the start plus the calculated duration. (Note that Cesium uses Julian dates. See 
                https://simple.wikipedia.org/wiki/Julian_day.)
              Initialize the viewer's clock by setting its start and stop to the flight start and stop times we just calculated. 
              Also, set the viewer's current time to the start time and take the user to that time. 
            */
            const timeStepInSeconds = 5;
            const totalSeconds = timeStepInSeconds * (flightData.length - 1);
            const start = JulianDate.fromIso8601("2020-03-09T23:10:00Z");
            const stop = JulianDate.addSeconds(start, totalSeconds, new JulianDate());
            viewer.clock.startTime = start.clone();
            viewer.clock.stopTime = stop.clone();
            viewer.clock.currentTime = start.clone();
            viewer.timeline.zoomTo(start, stop);
            // Speed up the playback speed 50x.
            viewer.clock.multiplier = 50;
            // Start playing the scene.
            viewer.clock.shouldAnimate = true;

            // The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
            const positionProperty = new SampledPositionProperty();

            for (let i = 0; i < flightData.length; i++) {
                const dataPoint = flightData[i];

                // Declare the time for this individual sample and store it in a new JulianDate instance.
                const time = JulianDate.addSeconds(start, i * timeStepInSeconds, new JulianDate());
                const position = Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height);
                // Store the position along with its timestamp.
                // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
                positionProperty.addSample(time, position);

                viewer.entities.add({
                    description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
                    position: position,
                    point: { pixelSize: 10, color: Color.RED }
                });
            }

            // STEP 6 CODE (airplane entity)
            async function loadModel() {
                // Load the glTF model from Cesium ion.
                const airplaneUri = await IonResource.fromAssetId(3638254);
                const airplaneEntity = viewer.entities.add({
                    availability: new TimeIntervalCollection([new TimeInterval({ start: start, stop: stop })]),
                    position: positionProperty,
                    // Attach the 3D model instead of the green point.
                    model: { uri: airplaneUri },
                    // Automatically compute the orientation from the position.
                    orientation: new VelocityOrientationProperty(positionProperty),
                    path: new PathGraphics({ width: 3 })
                });
                // Make the camera track this moving entity.
                viewer.trackedEntity = airplaneEntity;
            }
            loadModel();
        })();
    }, []);

    return <div id="cesiumContainer" style={{ width: "100%", height: "100vh" }} />;
}
