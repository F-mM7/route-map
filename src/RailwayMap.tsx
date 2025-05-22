import React from "react";
import { useZoomPan } from "./hooks/useZoomPan";
import lines from "./lines";
import Polyline from "./components/Polyline";

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
  // 東京付近の緯度1度と経度1度の距離比（cos緯度で補正）
  const latCenter = (minLat + maxLat) / 2;
  const lngScale = Math.cos((latCenter * Math.PI) / 180);

  // 地理的な幅・高さ（km相当の比率）
  const geoWidth = (maxLng - minLng) * lngScale;
  const geoHeight = maxLat - minLat;
  // 表示領域に収めるスケール
  const scale = Math.min(VIEW_WIDTH / geoWidth, VIEW_HEIGHT / geoHeight);

  // 余白（中央寄せ）
  const offsetX = (VIEW_WIDTH - geoWidth * scale) / 2;
  const offsetY = (VIEW_HEIGHT - geoHeight * scale) / 2;

  // 緯度経度→SVG座標
  const x = offsetX + (lng - minLng) * lngScale * scale;
  const y = VIEW_HEIGHT - (offsetY + (lat - minLat) * scale);
  return { x, y };
}

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
            {line.stations.map((station) => {
              const { x, y } = latLngToSvg(station.lat, station.lng);
              return (
                <g key={station.name}>
                  <circle
                    cx={x}
                    cy={y}
                    r={8}
                    fill={backgroundColor}
                    stroke={line.color}
                    strokeWidth={3}
                  />
                  <text x={x + 9} y={y + 5} fontSize={16} fill={textColor}>
                    {station.name}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </g>
    </svg>
  );
};

export default RailwayMap;
