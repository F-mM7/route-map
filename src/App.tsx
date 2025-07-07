import "./App.css";
import { useState } from "react";
import RailwayMap from "./RailwayMap";
import RouteSearch from "./components/RouteSearch";
import { spacing, colors } from "./styles/constants";


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
