import React, { useRef, useState } from "react";
import lines from "./lines";

// 表示領域サイズ（縦横別々に指定可能）
const VIEW_WIDTH = 700;
const VIEW_HEIGHT = 700;

// 全駅の緯度経度範囲を自動計算
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

// 緯度経度をSVG座標に変換（全駅が必ず収まるようにスケーリング＆中央寄せ）
function latLngToSvg(lat: number, lng: number) {
  // 地理的範囲（全駅分）
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

// パン（ドラッグ）範囲をズームに応じて制限（ズーム中心を維持し、ズーム倍率に応じて正しく制限）
function clampOffset(offset: { x: number; y: number }, zoom: number) {
  // ズーム時の可視領域サイズ
  const visibleWidth = VIEW_WIDTH / zoom;
  const visibleHeight = VIEW_HEIGHT / zoom;
  // パンの最大値（ズーム中心を維持し、ズーム倍率に応じて正しく制限）
  const maxX = (VIEW_WIDTH - visibleWidth) / 2 / zoom;
  const maxY = (VIEW_HEIGHT - visibleHeight) / 2 / zoom;
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

const RailwayMap: React.FC = () => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // ホイールでズーム
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const scale = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => {
      const nextZoom = Math.max(1, Math.min(5, z * scale));
      if (nextZoom === 1) setOffset({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  // ドラッグでパン（範囲制限あり）
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !lastPos.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }, zoom));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => {
    setDragging(false);
    lastPos.current = null;
  };

  // ズーム変更時にパン範囲も制限
  React.useEffect(() => {
    setOffset((prev) => clampOffset(prev, zoom));
  }, [zoom]);

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
      onWheel={handleWheel}
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
