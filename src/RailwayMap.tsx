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
const backgroundColor = "white";
const textColor = "#333333";

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
  } = useZoomPan();

  return (
    <svg
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
      <g transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}>
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
              const pathSegments: Array<{
                stations: Array<{ name: string; lat: number; lng: number }>;
                color: string;
              }> = [];
              
              let currentSegment: Array<{ name: string; lat: number; lng: number }> = [];
              let currentLineName = route.path[0].lineName;
              
              route.path.forEach((item, index) => {
                if (item.lineName === currentLineName) {
                  currentSegment.push(item.station);
                } else {
                  if (currentSegment.length > 0) {
                    const lineData = lines[currentLineName as keyof typeof lines];
                    pathSegments.push({
                      stations: [...currentSegment],
                      color: lineData?.color || '#000',
                    });
                  }
                  currentSegment = [item.station];
                  currentLineName = item.lineName;
                }
                
                if (index === route.path.length - 1 && currentSegment.length > 0) {
                  const lineData = lines[currentLineName as keyof typeof lines];
                  pathSegments.push({
                    stations: currentSegment,
                    color: lineData?.color || '#000',
                  });
                }
              });
              
              return (
                <g key={`route-${routeIndex}`}>
                  {pathSegments.map((segment, segmentIndex) => (
                    <Polyline
                      key={`route-${routeIndex}-segment-${segmentIndex}`}
                      color={segment.color}
                      stations={segment.stations}
                      latLngToSvg={latLngToSvg}
                      strokeWidth={6}
                    />
                  ))}
                </g>
              );
            })}
            
            {/* 経路上の駅のみマーカーとラベルを表示 */}
            {(() => {
              const uniqueStations = new Map<string, StationWithLine>();
              
              selectedRoutes.forEach(route => {
                route.path.forEach(item => {
                  const key = `${item.station.name}-${item.station.lat}-${item.station.lng}`;
                  if (!uniqueStations.has(key)) {
                    uniqueStations.set(key, item.station);
                  }
                });
              });
              
              const routeStations = Array.from(uniqueStations.values()).map(station => {
                const lineData = lines[station.lineName as keyof typeof lines];
                return {
                  name: station.name,
                  lat: station.lat,
                  lng: station.lng,
                  line: station.lineName,
                  color: lineData?.color || '#000',
                };
              });
              
              return (
                <>
                  <StationMarkers
                    stationList={routeStations}
                    latLngToSvg={latLngToSvg}
                    backgroundColor={backgroundColor}
                  />
                  <StationLabels
                    stationList={routeStations}
                    latLngToSvg={latLngToSvg}
                    textColor={textColor}
                  />
                </>
              );
            })()}
          </>
        )}
      </g>
    </svg>
  );
};

export default RailwayMap;
