import React, { useRef, useState } from "react";
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

// パン（ドラッグ）範囲をズームに応じて制限（ズーム中心を維持し、ズーム倍率に応じて正しく制限）
function clampOffset(offset: { x: number; y: number }, zoom: number) {
  const visibleWidth = VIEW_WIDTH / zoom;
  const visibleHeight = VIEW_HEIGHT / zoom;

  // 地図全体の幅と高さ
  const mapWidth = VIEW_WIDTH;
  const mapHeight = VIEW_HEIGHT;

  // オフセットの最大・最小値を計算
  const maxX = (mapWidth - visibleWidth) / 2;
  const maxY = (mapHeight - visibleHeight) / 2;

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

  React.useEffect(() => {
    const svgElement = document.querySelector("svg");
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const svgRect = svgElement!.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      const scale = e.deltaY < 0 ? 1.1 : 0.9;

      setZoom((z) => {
        const nextZoom = Math.max(1, Math.min(5, z * scale));
        setOffset((prev) => {
          const zoomFactor = nextZoom / z;
          const dx = (mouseX - VIEW_WIDTH / 2 - prev.x) * (1 - zoomFactor);
          const dy = (mouseY - VIEW_HEIGHT / 2 - prev.y) * (1 - zoomFactor);
          const newOffset = { x: prev.x + dx, y: prev.y + dy };
          return clampOffset(newOffset, nextZoom);
        });
        return nextZoom;
      });
    };

    svgElement?.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      svgElement?.removeEventListener("wheel", handleWheel);
    };
  }, []);

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
