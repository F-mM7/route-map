import { useState, useRef, useEffect, useCallback } from "react";

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 1024;

function clampOffset(offset: { x: number; y: number }, zoom: number) {
  if (zoom <= 1) {
    return { x: 0, y: 0 };
  }

  // SVG座標系では、transform="translate(x,y) scale(zoom)"により
  // (0,0)が左上角から(offset.x, offset.y)に移動し、全体がzoom倍される
  
  // ズーム後の仮想コンテンツサイズ
  const scaledWidth = VIEW_WIDTH * zoom;
  const scaledHeight = VIEW_HEIGHT * zoom;
  
  // ビューポート(1024x1024)に対して、スケール後のコンテンツがはみ出る量
  const overflowX = scaledWidth - VIEW_WIDTH;  // 横方向のはみ出し量
  const overflowY = scaledHeight - VIEW_HEIGHT; // 縦方向のはみ出し量
  
  // パン可能範囲: はみ出した分だけ移動可能
  // 正の値で左上方向、負の値で右下方向に移動
  const maxPanX = overflowX / 2;
  const maxPanY = overflowY / 2;

  return {
    x: Math.max(-maxPanX, Math.min(maxPanX, offset.x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, offset.y)),
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
          
          // マウス位置を中心にズーム
          const zoomFactor = nextZoom / prevZoom;
          const centerX = VIEW_WIDTH / 2;
          const centerY = VIEW_HEIGHT / 2;
          
          // マウス位置からビューポート中心への相対位置
          const relativeX = mouseX - centerX;
          const relativeY = mouseY - centerY;
          
          // ズーム前の実際のマウス位置（オフセット込み）
          const worldMouseX = relativeX - prevOffset.x;
          const worldMouseY = relativeY - prevOffset.y;
          
          // ズーム後に同じ世界座標を維持するための新しいオフセット
          const newOffsetX = relativeX - worldMouseX * zoomFactor;
          const newOffsetY = relativeY - worldMouseY * zoomFactor;
          
          return clampOffset({ 
            x: newOffsetX, 
            y: newOffsetY 
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
