"use client";
import { useEffect } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { getFitbitData } from "@/app/utils/converter";
import { HeightReference } from "cesium";

export default function FitbitTrackerView() {
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
            const fitbitData = await getFitbitData("../fitbit/fitbit_response.xml");
            const timeStepInSeconds = 20;
            const totalSeconds = timeStepInSeconds * (fitbitData.length - 1);
            const start = JulianDate.fromIso8601("2025-07-20T23:10:00Z");
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

            for (let i = 0; i < fitbitData.length; i++) {
                const track = fitbitData[i];

                for (let j = 0; j < track.points.length; j++) {
                    const point = track.points[j];

                    // Declare the time for this individual sample and store it in a new JulianDate instance.
                    const time = JulianDate.addSeconds(start, j * timeStepInSeconds, new JulianDate());
                    const position = Cartesian3.fromDegrees(point.position.longitude, point.position.latitude);
                    // Store the position along with its timestamp.
                    // Here we add the positions all upfront, but these can be added at run-time as samples are received from a server.
                    positionProperty.addSample(time, position);

                    viewer.entities.add({
                        description: `Location: (${point.position.longitude}, ${point.position.latitude}, ${point.altitude})`,
                        position: position,
                        point: { pixelSize: 10, color: Color.RED, heightReference: HeightReference.CLAMP_TO_GROUND }
                    });
                }
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
