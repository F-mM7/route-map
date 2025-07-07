import React from "react";
import type { Station } from "../types/Station";

type StationLabelsProps = {
  stationList: Station[];
  latLngToSvg: (lat: number, lng: number) => { x: number; y: number };
  textColor: string;
  opacity?: number;
};

const StationLabels: React.FC<StationLabelsProps> = ({
  stationList,
  latLngToSvg,
  textColor,
  opacity = 1,
}) => {
  return (
    <>
      {stationList.map((station) => {
        const { x, y } = latLngToSvg(station.lat, station.lng);
        return (
          <g key={station.name + station.line + "string"}>
            <text 
              x={x + 12} 
              y={y + 5} 
              fontSize={14} 
              fill={textColor} 
              opacity={opacity}
              stroke="white"
              strokeWidth={3}
              paintOrder="stroke"
              fontWeight="bold"
            >
              {station.name}
            </text>
            <text 
              x={x + 12} 
              y={y + 5} 
              fontSize={14} 
              fill={textColor} 
              opacity={opacity}
              fontWeight="bold"
            >
              {station.name}
            </text>
          </g>
        );
      })}
    </>
  );
};

export default StationLabels;
