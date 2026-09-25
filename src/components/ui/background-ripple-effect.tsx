"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BackgroundRippleEffectProps {
  rows?: number;
  cols?: number;
  cellSize?: number;
  className?: string;
  borderColor?: string;
  fillColor?: string;
  interactive?: boolean;
}

export const BackgroundRippleEffect: React.FC<BackgroundRippleEffectProps> = ({
  rows: initialRows,
  cols: initialCols,
  cellSize = 52,
  className,
  borderColor,
  fillColor,
  interactive = true,
}) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Dynamically calculate rows and columns to fill screen
  const [dimensions, setDimensions] = useState({
    rows: initialRows || 18,
    cols: initialCols || 36,
  });

  useEffect(() => {
    const updateGridSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const computedCols = Math.ceil(width / cellSize) + 2;
      const computedRows = Math.ceil(height / cellSize) + 2;
      setDimensions({
        cols: initialCols || Math.max(12, computedCols),
        rows: initialRows || Math.max(10, computedRows),
      });
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize);
    return () => window.removeEventListener("resize", updateGridSize);
  }, [cellSize, initialRows, initialCols]);

  const rows = dimensions.rows;
  const cols = dimensions.cols;

  // Global background click listener to trigger ripple when clicking anywhere on the page canvas
  useEffect(() => {
    if (!interactive) return;

    const handleWindowClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Skip if clicking actionable UI elements
      if (target.closest('button, input, textarea, a, select, [role="button"], .glass-card, [tabindex="0"]')) {
        return;
      }

      if (!gridContainerRef.current) return;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          setClickedCell({ row, col });
          setRippleKey((k) => k + 1);
        }
      }
    };

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [interactive, cellSize, rows, cols]);

  return (
    <div
      className={cn(
        "fixed inset-0 h-full w-full overflow-hidden select-none pointer-events-auto bg-[#08090b]",
        className
      )}
      style={{
        maskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 75%, rgba(0,0,0,0.5) 92%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 75%, rgba(0,0,0,0.5) 92%, transparent 100%)',
      }}
    >
      <div 
        ref={gridContainerRef}
        className="relative h-full w-full flex items-center justify-center overflow-hidden"
      >
        <DivGrid
          key={`base-${rippleKey}`}
          className="opacity-95 transition-opacity duration-300"
          rows={rows}
          cols={cols}
          cellSize={cellSize}
          borderColor={borderColor || "rgba(255,255,255,0.08)"}
          fillColor={fillColor || "rgba(255,255,255,0.02)"}
          clickedCell={clickedCell}
          onCellClick={(row, col) => {
            setClickedCell({ row, col });
            setRippleKey((k) => k + 1);
          }}
          interactive={interactive}
        />
      </div>
    </div>
  );
};

type DivGridProps = {
  key?: React.Key;
  className?: string;
  rows: number;
  cols: number;
  cellSize: number;
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

const DivGrid = ({
  className,
  rows = 18,
  cols = 36,
  cellSize = 52,
  borderColor = "rgba(255,255,255,0.08)",
  fillColor = "rgba(255,255,255,0.02)",
  clickedCell = null,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols]
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
    marginInline: "auto",
  };

  return (
    <div className={cn("relative z-[1]", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 45) : 0; // ms
        const duration = 320 + distance * 50; // ms

        const style: CellStyle = clickedCell
          ? {
              "--delay": `${delay}ms`,
              "--duration": `${duration}ms`,
            }
          : {};

        return (
          <div
            key={idx}
            className={cn(
              "cell relative border-[0.5px] opacity-40 transition-all duration-200 will-change-transform cursor-pointer",
              "hover:opacity-100 hover:bg-white/[0.08] hover:border-white/25 hover:shadow-[0_0_8px_rgba(255,255,255,0.12)]",
              clickedCell && "animate-cell-ripple [animation-fill-mode:none]",
              !interactive && "pointer-events-none"
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: borderColor,
              ...style,
            }}
            onClick={
              interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
            }
          />
        );
      })}
    </div>
  );
};
