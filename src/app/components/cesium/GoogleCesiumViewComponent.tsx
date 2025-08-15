"use client";
import { useEffect } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";
export default function GoogleCesiumView() {
    useEffect(() => {
        window.CESIUM_BASE_URL = "/cesium";
        (async () => {
            const { Viewer, Ion, Cartesian3, Math: CesiumMath, createGooglePhotorealistic3DTileset, IonGeocodeProviderType } =
                await import("cesium");

            Ion.defaultAccessToken = process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN!;
            const viewer = new Viewer("cesiumContainer", {
                globe: false,
                geocoder: IonGeocodeProviderType.GOOGLE
            });
            viewer.camera.flyTo({
                // 東京の座標
                destination: Cartesian3.fromDegrees(139.6917, 35.6895, 400),
                orientation: { heading: CesiumMath.toRadians(0), pitch: CesiumMath.toRadians(-15) }
            });
            const tiles = await createGooglePhotorealistic3DTileset();
            viewer.scene.primitives.add(tiles);
        })();
    }, []);
    return <div id="cesiumContainer" style={{ width: "100%", height: "100vh" }} />;
}