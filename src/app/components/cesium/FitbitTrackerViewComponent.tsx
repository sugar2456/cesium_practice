"use client";
import { useEffect } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { getFitbitData } from "@/app/utils/converter";
import { createOsmBuildingsAsync, HeightReference } from "cesium";

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
            const fitbitData = await getFitbitData("../fitbit/sample_imperial_palace_tour.xml");
            
            // 全データポイントの総数を計算
            let totalPoints = 0;
            for (const track of fitbitData) {
                totalPoints += track.points.length;
            }
            
            // Fitbitデータの最初の時間を開始時刻として使用
            const firstPoint = fitbitData[0]?.points[0];
            if (!firstPoint || !firstPoint.timestamp) {
                throw new Error("Fitbitデータに時間情報がありません");
            }
            
            const timeStepInSeconds = 5;
            const totalSeconds = timeStepInSeconds * (totalPoints - 1);
            const start = JulianDate.fromIso8601(firstPoint.timestamp);
            const stop = JulianDate.addSeconds(start, totalSeconds, new JulianDate());
            
            viewer.clock.startTime = start.clone();
            viewer.clock.stopTime = stop.clone();
            viewer.clock.currentTime = start.clone();
            viewer.timeline.zoomTo(start, stop);
            // Speed up the playback speed 50x.
            viewer.clock.multiplier = 50;
            // Start playing the scene.
            viewer.clock.shouldAnimate = true;
            
            // OSMビルディングを追加
            const tiles = await createOsmBuildingsAsync();
            viewer.scene.primitives.add(tiles);
            
            // ビルディングの表示設定を調整
            viewer.scene.globe.enableLighting = false; // ライティングを無効化してビルディングを見やすく
            if (viewer.scene.skyAtmosphere) {
                viewer.scene.skyAtmosphere.show = false; // 大気効果を無効化
            }
            
            // 初期カメラ位置を設定（ビルディングが見える位置）
            viewer.camera.setView({
                destination: Cartesian3.fromDegrees(
                    firstPoint.position.longitude,
                    firstPoint.position.latitude,
                    1000 // 高さを1000メートルに設定してビルディングが見えるように
                ),
                orientation: {
                    heading: 0.0,
                    pitch: -Math.PI / 2,
                    roll: 0.0
                }
            });

            // The SampledPositionedProperty stores the position and timestamp for each sample along the radar sample series.
            const positionProperty = new SampledPositionProperty();
            let currentTimeIndex = 0;

            // 全データポイントを時系列順に処理
            for (let i = 0; i < fitbitData.length; i++) {
                const track = fitbitData[i];

                for (let j = 0; j < track.points.length; j++) {
                    const point = track.points[j];

                    // 累積時間を使用して時間を計算
                    const time = JulianDate.addSeconds(start, currentTimeIndex * timeStepInSeconds, new JulianDate());
                    // 高さ情報を含む位置を作成（地面から100メートル上）
                    const position = Cartesian3.fromDegrees(
                        point.position.longitude, 
                        point.position.latitude, 
                        (point.altitude || 0) + 100
                    );
                    
                    // Store the position along with its timestamp.
                    positionProperty.addSample(time, position);
                    
                    currentTimeIndex++;
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
                    model: { 
                        uri: airplaneUri,
                        scale: 0.5, // モデルのスケールを調整
                        heightReference: HeightReference.CLAMP_TO_GROUND,
                        minimumPixelSize: 64, // 最小ピクセルサイズを設定
                        maximumScale: 2.0 // 最大スケールを制限
                    },
                    // Automatically compute the orientation from the position.
                    orientation: new VelocityOrientationProperty(positionProperty)
                });
                // Make the camera track this moving entity.
                viewer.trackedEntity = airplaneEntity;
            }
            loadModel();
        })();
    }, []);

    return <div id="cesiumContainer" style={{ width: "100%", height: "100vh" }} />;
}
