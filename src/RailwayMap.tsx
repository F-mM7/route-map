import React from "react";
import { useZoomPan } from "./hooks/useZoomPan";
import lines from "./lines";

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 1024;

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
        background: "#f9f9f9",
        border: "1px solid #ccc",
        marginBottom: 32,
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
            <polyline
              fill="none"
              stroke={line.color}
              strokeWidth={4}
              points={line.stations
                .map((st) => {
                  const { x, y } = latLngToSvg(st.lat, st.lng);
                  return `${x},${y}`;
                })
                .join(" ")}
            />
            {line.stations.map((station) => {
              const { x, y } = latLngToSvg(station.lat, station.lng);
              return (
                <g key={station.name}>
                  <circle
                    cx={x}
                    cy={y}
                    r={8}
                    fill="#fff"
                    stroke={line.color}
                    strokeWidth={3}
                  />
                  <text
                    x={x + 12}
                    y={y + 4}
                    fontSize={14}
                    fill="#333"
                    fontFamily="sans-serif"
                  >
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
