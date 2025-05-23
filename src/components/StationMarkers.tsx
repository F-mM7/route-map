import React from "react";
import type { Station } from "../types/Station";

type StationMarkersProps = {
  stationList: Station[];
  latLngToSvg: (lat: number, lng: number) => { x: number; y: number };
  backgroundColor: string;
};

const StationMarkers: React.FC<StationMarkersProps> = ({
  stationList,
  latLngToSvg,
  backgroundColor,
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
              r={8}
              fill={backgroundColor}
              stroke={station.color}
              strokeWidth={3}
            />
          </g>
        );
      })}
    </>
  );
};

export default StationMarkers;
