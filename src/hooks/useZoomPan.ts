import { useState, useRef, useEffect } from "react";

// TODO めっちゃバグってる

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 1024;

function clampOffset(offset: { x: number; y: number }, zoom: number) {
  const visibleWidth = VIEW_WIDTH / zoom;
  const visibleHeight = VIEW_HEIGHT / zoom;

  const maxX = (VIEW_WIDTH - visibleWidth) / 2;
  const maxY = (VIEW_HEIGHT - visibleHeight) / 2;

  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

export function useZoomPan() {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

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

  useEffect(() => {
    setOffset((prev) => clampOffset(prev, zoom));
  }, [zoom]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const svgElement = e.target as SVGSVGElement;
      const svgRect = svgElement.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      const scale = e.deltaY < 0 ? 1.1 : 0.9;

      setZoom((z) => {
        const nextZoom = Math.max(1, Math.min(5, z * scale));
        setOffset((prev) => {
          const zoomFactor = nextZoom / z;
          const dx = (mouseX - VIEW_WIDTH / 2 - prev.x) * (1 - zoomFactor);
          const dy = (mouseY - VIEW_HEIGHT / 2 - prev.y) * (1 - zoomFactor);
          return clampOffset({ x: prev.x + dx, y: prev.y + dy }, nextZoom);
        });
        return nextZoom;
      });
    };

    const svgElement = document.querySelector("svg");
    svgElement?.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      svgElement?.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return {
    zoom,
    offset,
    dragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
