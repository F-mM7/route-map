import React from "react";

type Station = {
  lat: number;
  lng: number;
};

type PolylineProps = {
  color: string;
  stations: Station[];
  latLngToSvg: (lat: number, lng: number) => { x: number; y: number };
};

const Polyline: React.FC<PolylineProps> = ({
  color,
  stations,
  latLngToSvg,
}) => {
  const points = stations
    .map((station) => {
      const { x, y } = latLngToSvg(station.lat, station.lng);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <polyline fill="none" stroke={color} strokeWidth={4} points={points} />
  );
};

export default Polyline;
