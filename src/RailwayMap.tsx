import React from "react";
import { useZoomPan } from "./hooks/useZoomPan";
import lines from "./lines";
import Polyline from "./components/Polyline";
import StationMarkers from "./components/StationMarkers";
import StationLabels from "./components/StationLabels";
import type { Station } from "./types/Station";

interface StationWithLine {
  name: string;
  lat: number;
  lng: number;
  lineName: string;
}

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 1024;
const backgroundColor = "transparent";
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

function getRouteBounds(
  routes: Array<{
    from: string;
    to: string;
    path: Array<{
      station: {
        name: string;
        lat: number;
        lng: number;
        lineName: string;
      };
      lineName: string;
    }>;
    transfers: number;
  }>
) {
  if (routes.length === 0) {
    return getLatLngBounds();
  }

  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;

  routes.forEach((route) => {
    route.path.forEach((pathItem) => {
      const station = pathItem.station;
      if (station.lat < minLat) minLat = station.lat;
      if (station.lat > maxLat) maxLat = station.lat;
      if (station.lng < minLng) minLng = station.lng;
      if (station.lng > maxLng) maxLng = station.lng;
    });
  });

  return { minLat, maxLat, minLng, maxLng };
}

const bounds = getLatLngBounds();

function latLngToSvg(
  lat: number,
  lng: number,
  customBounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }
) {
  const { minLat, maxLat, minLng, maxLng } = customBounds || bounds;
  const latCenter = (minLat + maxLat) / 2;
  const lngScale = Math.cos((latCenter * Math.PI) / 180);

  const geoWidth = (maxLng - minLng) * lngScale;
  const geoHeight = maxLat - minLat;

  const padding = 80;
  const availableWidth = VIEW_WIDTH - padding * 2;
  const availableHeight = VIEW_HEIGHT - padding * 2;

  const scale = Math.min(
    availableWidth / geoWidth,
    availableHeight / geoHeight
  );

  const offsetX = padding + (availableWidth - geoWidth * scale) / 2;
  const offsetY = padding + (availableHeight - geoHeight * scale) / 2;

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

interface RailwayMapProps {
  selectedRoutes?: Array<{
    from: string;
    to: string;
    path: Array<{
      station: {
        name: string;
        lat: number;
        lng: number;
        lineName: string;
      };
      lineName: string;
    }>;
    transfers: number;
  }>;
}

const RailwayMap: React.FC<RailwayMapProps> = ({ selectedRoutes = [] }) => {
  const {
    zoom,
    offset,
    dragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    svgRef,
  } = useZoomPan();

  const createCleanSVG = () => {
    if (!svgRef.current) return null;
    
    const svgElement = svgRef.current.cloneNode(true) as SVGElement;
    svgElement.style.border = 'none';
    svgElement.style.borderRadius = '0';
    svgElement.style.boxShadow = 'none';
    
    return svgElement;
  };

  const downloadAsPNG = () => {
    const cleanSVG = createCleanSVG();
    if (!cleanSVG) return;
    
    const svgData = new XMLSerializer().serializeToString(cleanSVG);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = VIEW_WIDTH;
    canvas.height = VIEW_HEIGHT;
    
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'railway-map.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const downloadAsSVG = () => {
    const cleanSVG = createCleanSVG();
    if (!cleanSVG) return;
    
    const svgData = new XMLSerializer().serializeToString(cleanSVG);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'railway-map.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  // 経路選択時の描画範囲を計算
  const routeBounds =
    selectedRoutes.length > 0 ? getRouteBounds(selectedRoutes) : null;
  const latLngToSvgWithBounds = (lat: number, lng: number) =>
    latLngToSvg(lat, lng, routeBounds || undefined);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <button
          onClick={downloadAsPNG}
          style={{
            marginRight: '8px',
            padding: '8px 12px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        >
          PNG
        </button>
        <button
          onClick={downloadAsSVG}
          style={{
            padding: '8px 12px',
            background: '#059669',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        >
          SVG
        </button>
      </div>
      <svg
        ref={svgRef}
        width={VIEW_WIDTH}
        height={VIEW_HEIGHT}
        style={{
          background: backgroundColor,
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
      <g
        transform={`translate(${VIEW_WIDTH / 2},${
          VIEW_HEIGHT / 2
        }) scale(${zoom}) translate(${-VIEW_WIDTH / 2 + offset.x},${
          -VIEW_HEIGHT / 2 + offset.y
        })`}
      >
        {selectedRoutes.length === 0 ? (
          // 経路が選択されていない場合は全路線を表示
          <>
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
          </>
        ) : (
          // 経路が選択されている場合は経路のみ表示
          <>
            {selectedRoutes.map((route, routeIndex) => {
              // 経路を路線ごとに分割
              const pathSegments: Array<{
                stations: Array<{ name: string; lat: number; lng: number }>;
                color: string;
                lineName: string;
              }> = [];

              if (route.path.length === 0) return null;

              let currentSegment: Array<{
                name: string;
                lat: number;
                lng: number;
              }> = [];
              let currentLineName = route.path[0].lineName;

              // 最初の駅を追加
              currentSegment.push(route.path[0].station);

              for (let i = 1; i < route.path.length; i++) {
                const currentItem = route.path[i];

                if (currentItem.lineName === currentLineName) {
                  // 同じ路線の場合、駅を追加
                  currentSegment.push(currentItem.station);
                } else {
                  // 路線が変わる場合
                  // 現在の区間を保存
                  const lineData = lines[currentLineName as keyof typeof lines];
                  pathSegments.push({
                    stations: [...currentSegment],
                    color: lineData?.color || "#000",
                    lineName: currentLineName,
                  });

                  // 新しい区間を開始（乗り換え駅から）
                  currentSegment = [currentItem.station];
                  currentLineName = currentItem.lineName;
                }
              }

              // 最後の区間を保存
              if (currentSegment.length > 0) {
                const lineData = lines[currentLineName as keyof typeof lines];
                pathSegments.push({
                  stations: currentSegment,
                  color: lineData?.color || "#000",
                  lineName: currentLineName,
                });
              }

              return (
                <g key={`route-${routeIndex}`}>
                  {pathSegments.map((segment, segmentIndex) => (
                    <Polyline
                      key={`route-${routeIndex}-segment-${segmentIndex}`}
                      color={segment.color}
                      stations={segment.stations}
                      latLngToSvg={latLngToSvgWithBounds}
                      strokeWidth={6}
                    />
                  ))}
                </g>
              );
            })}

            {/* 乗り換え駅と終端駅のみマーカーとラベルを表示 */}
            {(() => {
              const transferAndEndStations = new Map<string, StationWithLine>();

              selectedRoutes.forEach((route) => {
                // 各経路の始点と終点を追加
                if (route.path.length > 0) {
                  const firstStation = route.path[0].station;
                  const lastStation = route.path[route.path.length - 1].station;

                  const firstKey = `${firstStation.name}-${firstStation.lat}-${firstStation.lng}`;
                  const lastKey = `${lastStation.name}-${lastStation.lat}-${lastStation.lng}`;

                  transferAndEndStations.set(firstKey, firstStation);
                  transferAndEndStations.set(lastKey, lastStation);
                }

                // 乗り換え駅を検出（路線名が変わる箇所）
                for (let i = 1; i < route.path.length; i++) {
                  if (route.path[i].lineName !== route.path[i - 1].lineName) {
                    const transferStation = route.path[i].station;
                    const key = `${transferStation.name}-${transferStation.lat}-${transferStation.lng}`;
                    transferAndEndStations.set(key, transferStation);

                    // 乗り換え前の駅も追加
                    const prevStation = route.path[i - 1].station;
                    const prevKey = `${prevStation.name}-${prevStation.lat}-${prevStation.lng}`;
                    transferAndEndStations.set(prevKey, prevStation);
                  }
                }
              });

              const displayStations = Array.from(
                transferAndEndStations.values()
              ).map((station) => {
                const lineData = lines[station.lineName as keyof typeof lines];
                return {
                  name: station.name,
                  lat: station.lat,
                  lng: station.lng,
                  line: station.lineName,
                  color: lineData?.color || "#000",
                };
              });

              return (
                <>
                  <StationMarkers
                    stationList={displayStations}
                    latLngToSvg={latLngToSvgWithBounds}
                    backgroundColor={backgroundColor}
                  />
                  <StationLabels
                    stationList={displayStations}
                    latLngToSvg={latLngToSvgWithBounds}
                    textColor={textColor}
                  />
                </>
              );
            })()}
          </>
        )}
      </g>
    </svg>
    </div>
  );
};

export default RailwayMap;
