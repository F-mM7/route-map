import React from "react";

type Station = {
  lat: number;
  lng: number;
};

type PolylineProps = {
  color: string;
  stations: Station[];
  latLngToSvg: (lat: number, lng: number) => { x: number; y: number };
  strokeWidth?: number;
  opacity?: number;
};

const Polyline: React.FC<PolylineProps> = ({
  color,
  stations,
  latLngToSvg,
  strokeWidth = 4,
  opacity = 1,
}) => {
  const points = stations
    .map((station) => {
      const { x, y } = latLngToSvg(station.lat, station.lng);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <polyline 
      fill="none" 
      stroke={color} 
      strokeWidth={strokeWidth} 
      points={points} 
      opacity={opacity}
    />
  );
};

export default Polyline;
