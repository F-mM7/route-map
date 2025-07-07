import { useState, useRef, useEffect, useCallback } from "react";

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 1024;

function clampOffset(offset: { x: number; y: number }, zoom: number) {
  if (zoom <= 1) {
    return { x: 0, y: 0 };
  }

  const scaledWidth = VIEW_WIDTH * zoom;
  const scaledHeight = VIEW_HEIGHT * zoom;
  
  const maxX = (scaledWidth - VIEW_WIDTH) / 2;
  const maxY = (scaledHeight - VIEW_HEIGHT) / 2;

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
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    svgRef.current = e.currentTarget;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !lastPos.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }, zoom));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [dragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    lastPos.current = null;
  }, []);

  useEffect(() => {
    setOffset((prev) => clampOffset(prev, zoom));
  }, [zoom]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (!svgRef.current) return;
      
      const svgRect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;
      const scale = e.deltaY < 0 ? 1.1 : 0.9;

      setZoom((prevZoom) => {
        const nextZoom = Math.max(1, Math.min(5, prevZoom * scale));
        
        setOffset((prevOffset) => {
          if (nextZoom <= 1) {
            return { x: 0, y: 0 };
          }
          
          const zoomFactor = nextZoom / prevZoom;
          const centerX = VIEW_WIDTH / 2;
          const centerY = VIEW_HEIGHT / 2;
          
          const dx = (mouseX - centerX - prevOffset.x) * (1 - zoomFactor);
          const dy = (mouseY - centerY - prevOffset.y) * (1 - zoomFactor);
          
          return clampOffset({ 
            x: prevOffset.x + dx, 
            y: prevOffset.y + dy 
          }, nextZoom);
        });
        
        return nextZoom;
      });
    };

    const currentSvg = svgRef.current;
    if (currentSvg) {
      currentSvg.addEventListener("wheel", handleWheel, { passive: false });
    }
    
    return () => {
      if (currentSvg) {
        currentSvg.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  return {
    zoom,
    offset,
    dragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    svgRef,
  };
}
