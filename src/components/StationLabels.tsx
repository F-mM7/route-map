import React from "react";
import type { Station } from "../types/Station";

type StationLabelsProps = {
  stationList: Station[];
  latLngToSvg: (lat: number, lng: number) => { x: number; y: number };
  textColor: string;
};

const StationLabels: React.FC<StationLabelsProps> = ({
  stationList,
  latLngToSvg,
  textColor,
}) => {
  return (
    <>
      {stationList.map((station) => {
        const { x, y } = latLngToSvg(station.lat, station.lng);
        return (
          <g key={station.name + station.line + "string"}>
            <text x={x + 9} y={y + 5} fontSize={16} fill={textColor}>
              {station.name}
            </text>
          </g>
        );
      })}
    </>
  );
};

export default StationLabels;
