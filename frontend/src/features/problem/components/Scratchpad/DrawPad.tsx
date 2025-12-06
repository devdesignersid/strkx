import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { StrokePath, Stroke } from './useScratchpad';

interface DrawPadProps {
    strokePaths: StrokePath[];
    onStrokePath: (path: StrokePath) => void;
    strokeColor?: string;
    strokeSize?: number;
}

export function DrawPad({
    strokePaths = [],
    onStrokePath,
    strokeColor = 'hsl(153, 60%, 53%)', // Primary color
    strokeSize = 3
}: DrawPadProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const currentPath = useRef<Stroke[]>([]);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    // Resize canvas to match container
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
        }
    }, []);

    // Redraw all strokes
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        strokePaths.forEach((path) => {
            if (path.points.length === 0) return;

            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.size;

            const points = path.points;
            if (points.length === 1) {
                // Single point - draw a dot
                ctx.arc(points[0].x, points[0].y, path.size / 2, 0, Math.PI * 2);
                ctx.fillStyle = path.color;
                ctx.fill();
            } else {
                // Draw smooth curve through points
                ctx.moveTo(points[0].x, points[0].y);

                for (let i = 1; i < points.length - 1; i++) {
                    const xc = (points[i].x + points[i + 1].x) / 2;
                    const yc = (points[i].y + points[i + 1].y) / 2;
                    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
                }

                // Last point
                if (points.length > 1) {
                    const last = points[points.length - 1];
                    ctx.lineTo(last.x, last.y);
                }

                ctx.stroke();
            }
        });
    }, [strokePaths]);

    // Handle resize
    useEffect(() => {
        resizeCanvas();
        const handleResize = () => {
            resizeCanvas();
            redraw();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [resizeCanvas, redraw]);

    // Redraw when strokes change
    useEffect(() => {
        redraw();
    }, [redraw]);

    const getPointerPos = (e: React.PointerEvent): { x: number; y: number } => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const drawCurrentStroke = (point: { x: number; y: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeSize;

        if (lastPoint.current) {
            ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }

        lastPoint.current = point;
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        const pos = getPointerPos(e);
        setIsDrawing(true);
        lastPoint.current = pos;
        currentPath.current = [{
            x: pos.x,
            y: pos.y,
            size: strokeSize,
            color: strokeColor,
            t: Date.now(),
        }];

        // Capture pointer for smoother drawing
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;

        const pos = getPointerPos(e);
        currentPath.current.push({
            x: pos.x,
            y: pos.y,
            size: strokeSize,
            color: strokeColor,
            pressure: e.pressure,
            t: Date.now(),
        });

        drawCurrentStroke(pos);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDrawing) return;

        setIsDrawing(false);
        (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);

        if (currentPath.current.length > 0) {
            onStrokePath({
                points: currentPath.current,
                color: strokeColor,
                size: strokeSize,
            });
        }

        currentPath.current = [];
        lastPoint.current = null;
    };

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 touch-none cursor-crosshair"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerUp}
                aria-label="Drawing canvas"
                role="img"
            />
            {strokePaths.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-muted-foreground/30 text-sm">Draw here...</span>
                </div>
            )}
        </div>
    );
}
