import React from "react";
import { useZoomPan } from "./hooks/useZoomPan";
import lines from "./lines";
import Polyline from "./components/Polyline";
import StationMarkers from "./components/StationMarkers";
import StationLabels from "./components/StationLabels";
import type { Station } from "./types/Station";

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 1024;
const backgroundColor = "white";
const textColor = "black";

function getLatLngBounds() {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  Object.values(lines).forEach((line) => {
    line.stations.forEach((st) => {
      if (st.lat < minLat) minLat = st.lat;
      if (st.lat > maxLat) maxLat = st.lat;
      if (st.lng < minLng) minLng = st.lng;
      if (st.lng > maxLng) maxLng = st.lng;
    });
  });
  return { minLat, maxLat, minLng, maxLng };
}

const bounds = getLatLngBounds();

function latLngToSvg(lat: number, lng: number) {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latCenter = (minLat + maxLat) / 2;
  const lngScale = Math.cos((latCenter * Math.PI) / 180);

  const geoWidth = (maxLng - minLng) * lngScale;
  const geoHeight = maxLat - minLat;
  const scale = Math.min(VIEW_WIDTH / geoWidth, VIEW_HEIGHT / geoHeight);

  const offsetX = (VIEW_WIDTH - geoWidth * scale) / 2;
  const offsetY = (VIEW_HEIGHT - geoHeight * scale) / 2;

  const x = offsetX + (lng - minLng) * lngScale * scale;
  const y = VIEW_HEIGHT - (offsetY + (lat - minLat) * scale);
  return { x, y };
}

const stationList: Station[] = Object.values(lines).flatMap((line) =>
  line.stations.map((station) => ({
    name: station.name,
    lat: station.lat,
    lng: station.lng,
    line: line.name,
    color: line.color,
  }))
);

const RailwayMap: React.FC = () => {
  const {
    zoom,
    offset,
    dragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useZoomPan();

  return (
    <svg
      width={VIEW_WIDTH}
      height={VIEW_HEIGHT}
      style={{
        background: backgroundColor,
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <g transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}>
        {Object.entries(lines).map(([lineName, line]) => (
          <g key={lineName}>
            <Polyline
              color={line.color}
              stations={line.stations}
              latLngToSvg={latLngToSvg}
            />
          </g>
        ))}
        <StationMarkers
          stationList={stationList}
          latLngToSvg={latLngToSvg}
          backgroundColor={backgroundColor}
        />
        <StationLabels
          stationList={stationList}
          latLngToSvg={latLngToSvg}
          textColor={textColor}
        />
      </g>
    </svg>
  );
};

export default RailwayMap;
