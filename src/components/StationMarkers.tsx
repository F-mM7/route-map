import React from "react";
import type { Station } from "../types/Station";

type StationMarkersProps = {
  stationList: Station[];
  latLngToSvg: (lat: number, lng: number) => { x: number; y: number };
  backgroundColor: string;
  opacity?: number;
};

const StationMarkers: React.FC<StationMarkersProps> = ({
  stationList,
  latLngToSvg,
  backgroundColor,
  opacity = 1,
}) => {
  return (
    <>
      {stationList.map((station) => {
        const { x, y } = latLngToSvg(station.lat, station.lng);
        return (
          <g key={station.name + station.line + "circle"}>
            <circle
              cx={x}
              cy={y}
              r={7}
              fill={backgroundColor}
              stroke={station.color}
              strokeWidth={2.5}
              opacity={opacity}
            />
          </g>
        );
      })}
    </>
  );
};

export default StationMarkers;
