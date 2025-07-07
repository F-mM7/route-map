import "./App.css";
import { useEffect, useState } from "react";
import RailwayMap from "./RailwayMap";
import RouteSearch from "./components/RouteSearch";
import lines from "./lines";
import { spacing, colors } from "./styles/constants";

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

function App() {
  const [selectedRoutes, setSelectedRoutes] = useState<Array<{
    from: string;
    to: string;
    path: Array<{
      station: {
        name: string;
        lat: number;
        lng: number;
        lineName: string;
      };
      lineName: string;
    }>;
    transfers: number;
  }>>([])

  const [distanceThreshold, setDistanceThreshold] = useState(300);

  useEffect(() => {
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const dist = calcDistance(stations[i], stations[j]);
        if (dist < distanceThreshold) {
          console.log(
            `近い駅ペア: ${stations[i].name} - ${stations[j].name} (距離: ${dist})`
          );
        }
      }
    }
  }, [distanceThreshold]);

  const handleRoutesFound = (routes: Array<{
    from: string;
    to: string;
    path: Array<{
      station: {
        name: string;
        lat: number;
        lng: number;
        lineName: string;
      };
      lineName: string;
    }>;
    transfers: number;
  }>) => {
    setSelectedRoutes(routes);
  };

  return (
    <div style={{ padding: spacing.xl }}>
      <h2 style={{ color: colors.text.primary, marginBottom: spacing.lg }}>路線図（全路線重ねて表示）</h2>
      <div style={{ marginBottom: spacing.lg }}>
        <label style={{ color: colors.text.primary, marginRight: spacing.md }}>
          駅同一視距離 (m):
        </label>
        <input
          type="number"
          value={distanceThreshold}
          onChange={(e) => setDistanceThreshold(Number(e.target.value))}
          style={{
            padding: spacing.sm,
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100px"
          }}
        />
      </div>
      <RouteSearch onRoutesFound={handleRoutesFound} distanceThreshold={distanceThreshold} />
      <RailwayMap selectedRoutes={selectedRoutes} />
    </div>
  );
}

export default App;
