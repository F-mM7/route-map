import "./App.css";
import { useEffect } from "react";
import RailwayMap from "./RailwayMap";
import lines from "./lines";

const stations = Object.values(lines).flatMap((line) => line.stations);

function calcDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = lat2 - lat1;
  const dLng = toRad(b.lng - a.lng);
  const avgLat = (lat1 + lat2) / 2;
  const R = 6378137;
  const x = dLng * Math.cos(avgLat) * R;
  const y = dLat * R;
  return Math.sqrt(x * x + y * y);
}

const DIST_THRESHOLD = 300;

function App() {
  useEffect(() => {
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const dist = calcDistance(stations[i], stations[j]);
        if (dist < DIST_THRESHOLD) {
          console.log(
            `近い駅ペア: ${stations[i].name} - ${stations[j].name} (距離: ${dist})`
          );
        }
      }
    }
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>路線図（全路線重ねて表示）</h2>
      <RailwayMap />
    </div>
  );
}

export default App;
