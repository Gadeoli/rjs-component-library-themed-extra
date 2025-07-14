import React, { useRef, useEffect, useState, MouseEvent } from 'react';

const WRAP_WIDTH = 200;

type Point = { x: number; y: number };

type TextItem = {
  text: string;
  x: number;
  y: number;
  font: string;
  color: string;
  rotation: number; // degrees
  scale: number;
};

type DrawTool = 'pen' | 'line' | 'circle' | 'arrow' | 'eraser';

type DrawingItem = {
  tool: DrawTool;
  points: Point[]; // For line/arrow exactly 2 points, circle [center, edge], pen/eraser multiple points
  color?: string; // not needed for eraser
  width: number;
  erase?: boolean;
};

type Mode = 'write' | 'draw';

const ImageEditorGPT: React.FC = () => {
  /* ---------- refs & ctx ---------- */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  /* ---------- global mode ---------- */
  const [mode, setMode] = useState<Mode>('write');

  /* ---------- text state ---------- */
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /* ---------- draw state ---------- */
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  /* ---------- brush & tool ---------- */
  const [drawColor, setDrawColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');

  /* ---------- dragging text ---------- */
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [editorPos, setEditorPos] = useState<Point>({ x: 0, y: 0 });

  /* ---------- text editor inputs ---------- */
  const [textInput, setTextInput] = useState('');
  const [font, setFont] = useState('20px Arial');
  const [color, setColor] = useState('#000000');
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  /* ---------- undo / redo ---------- */
  type UndoRedoItem = {
    texts: TextItem[];
    drawings: DrawingItem[];
  };

  const [undoStack, setUndoStack] = useState<UndoRedoItem[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoItem[]>([]);

  const pushUndo = () => {
    setUndoStack((prev) => [
      ...prev,
      {
        texts: JSON.parse(JSON.stringify(texts)),
        drawings: JSON.parse(JSON.stringify(drawings)),
      },
    ]);
    setRedoStack([]); // clear redo on new action
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((redo) => [
      ...redo,
      {
        texts: JSON.parse(JSON.stringify(texts)),
        drawings: JSON.parse(JSON.stringify(drawings)),
      },
    ]);
    setTexts(prev.texts);
    setDrawings(prev.drawings);
    setSelectedIndex(null);
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((undo) => [
      ...undo,
      {
        texts: JSON.parse(JSON.stringify(texts)),
        drawings: JSON.parse(JSON.stringify(drawings)),
      },
    ]);
    setTexts(next.texts);
    setDrawings(next.drawings);
    setSelectedIndex(null);
  };

  /* ---------- canvas boot ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 800;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.textBaseline = 'top';
    setCtx(context);
  }, []);

  /* ---------- helpers ---------- */
  const getLines = (context: CanvasRenderingContext2D, txt: string, fnt: string) => {
    context.font = fnt;
    const words = txt.split(' ');
    const lines: string[] = [];
    let line = '';
    words.forEach((w, idx) => {
      const test = line ? `${line} ${w}` : w;
      if (context.measureText(test).width > WRAP_WIDTH && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
      if (idx === words.length - 1) lines.push(line);
    });
    return lines;
  };

  const getMetrics = (t: TextItem) => {
    if (!ctx) return { lines: [], width: 0, height: 0, lineHeight: 0 };
    ctx.font = t.font;
    const lines = getLines(ctx, t.text, t.font);
    const lineHeight = parseInt(t.font, 10);
    const width = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const height = lineHeight * lines.length;
    return { lines, width, height, lineHeight };
  };

  const isInside = (pos: Point, t: TextItem) => {
    if (!ctx) return false;
    const { width, height } = getMetrics(t);
    const dx = pos.x - t.x;
    const dy = pos.y - t.y;
    const angle = (-t.rotation * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const localX = rx / t.scale;
    const localY = ry / t.scale;
    return localX >= 0 && localX <= width && localY >= 0 && localY <= height;
  };

  const drawArrowHead = (p0: Point, p1: Point, size: number): [Point, Point] => {
    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const left = {
      x: p1.x - size * cos + (size / 2) * sin,
      y: p1.y - size * sin - (size / 2) * cos,
    };
    const right = {
      x: p1.x - size * cos - (size / 2) * sin,
      y: p1.y - size * sin + (size / 2) * cos,
    };
    return [left, right];
  };

  /* ---------- drawAll ---------- */
  const drawAll = () => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render drawings
    drawings.forEach((d) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = d.width;
      if (d.erase) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = d.color || 'black';
      }

      if (d.tool === 'line') {
        const [p0, p1] = d.points;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      } else if (d.tool === 'circle') {
        const [center, edge] = d.points;
        const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (d.tool === 'arrow') {
        const [p0, p1] = d.points;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        const headSize = 8 + d.width * 1.5;
        const [left, right] = drawArrowHead(p0, p1, headSize);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.closePath();
        ctx.fillStyle = d.color || 'black';
        ctx.fill();
      } else {
        // pen / eraser path
        if (d.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(d.points[0].x, d.points[0].y);
        d.points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      }
      ctx.restore();
    });

    // Preview current in-progress drawing
    if (isDrawing && currentPath.length) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      if (drawTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColor;
      }

      if (drawTool === 'line' && currentPath.length === 2) {
        const [p0, p1] = currentPath;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      } else if (drawTool === 'circle' && currentPath.length === 2) {
        const [center, edge] = currentPath;
        const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (drawTool === 'arrow' && currentPath.length === 2) {
        const [p0, p1] = currentPath;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        const headSize = 8 + brushSize * 1.5;
        const [left, right] = drawArrowHead(p0, p1, headSize);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.closePath();
        ctx.fillStyle = drawColor;
        ctx.fill();
      } else if (drawTool === 'pen') {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        currentPath.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render texts
    texts.forEach((t, i) => {
      const { lines, width, height, lineHeight } = getMetrics(t);
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.scale(t.scale, t.scale);
      ctx.font = t.font;
      ctx.fillStyle = t.color;
      lines.forEach((ln, idx) => ctx.fillText(ln, 0, idx * lineHeight));
      if (i === selectedIndex) {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(0, 0, width, height);
      }
      ctx.restore();
    });
  };

  useEffect(drawAll, [
    texts,
    drawings,
    currentPath,
    selectedIndex,
    ctx,
    brushSize,
    drawColor,
    drawTool,
    isDrawing,
  ]);

  /* ---------- mouse helpers ---------- */
  const getMousePos = (e: MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /* ---------- canvas events ---------- */
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'write') return;
    const pos = getMousePos(e);
    const idx = texts.findIndex((t) => isInside(pos, t));
    if (idx !== -1) {
      const t = texts[idx];
      setSelectedIndex(idx);
      setTextInput(t.text);
      setFont(t.font);
      setColor(t.color);
      setRotation(t.rotation);
      setScale(t.scale);
      setEditorPos({ x: pos.x + 10, y: pos.y + 10 });
    } else {
      setSelectedIndex(null);
    }
  };

  const handleDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'write') return;
    pushUndo();
    const pos = getMousePos(e);
    const newText: TextItem = {
      text: 'New Text',
      x: pos.x,
      y: pos.y,
      font,
      color,
      rotation: 0,
      scale: 1,
    };
    setTexts((prev) => [...prev, newText]);
    setSelectedIndex(texts.length);
    setTextInput('New Text');
    setRotation(0);
    setScale(1);
    setEditorPos({ x: pos.x + 10, y: pos.y + 10 });
  };

  const updateText = () => {
    if (selectedIndex === null) return;
    pushUndo();
    setTexts((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = {
        ...updated[selectedIndex],
        text: textInput,
        font,
        color,
        rotation,
        scale,
      };
      return updated;
    });
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    if (mode === 'draw') {
      pushUndo();
      setIsDrawing(true);
      if (drawTool === 'line' || drawTool === 'arrow' || drawTool === 'circle') {
        setCurrentPath([pos]); // start point
      } else {
        setCurrentPath([pos]);
      }
    } else if (selectedIndex !== null) {
      const t = texts[selectedIndex];
      if (isInside(pos, t)) {
        pushUndo();
        setDragging(true);
        setDragOffset({ x: pos.x - t.x, y: pos.y - t.y });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    if (mode === 'draw' && isDrawing) {
      if (drawTool === 'line' || drawTool === 'arrow' || drawTool === 'circle') {
        setCurrentPath((prev) => (prev.length === 1 ? [prev[0], pos] : [prev[0], pos]));
      } else {
        setCurrentPath((prev) => [...prev, pos]);
      }
    } else if (dragging && selectedIndex !== null) {
      setTexts((prev) => {
        const up = [...prev];
        up[selectedIndex] = { ...up[selectedIndex], x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        return up;
      });
      setEditorPos({ x: pos.x + 10, y: pos.y + 10 });
    }
  };

  const finalizeDrawing = () => {
    if (!isDrawing) return;
    if (drawTool === 'line' && currentPath.length === 2) {
      setDrawings((prev) => [
        ...prev,
        { tool: 'line', points: currentPath, color: drawColor, width: brushSize },
      ]);
    } else if (drawTool === 'circle' && currentPath.length === 2) {
      setDrawings((prev) => [
        ...prev,
        { tool: 'circle', points: currentPath, color: drawColor, width: brushSize },
      ]);
    } else if (drawTool === 'arrow' && currentPath.length === 2) {
      setDrawings((prev) => [
        ...prev,
        { tool: 'arrow', points: currentPath, color: drawColor, width: brushSize },
      ]);
    } else if (drawTool === 'eraser') {
      if (currentPath.length > 1)
        setDrawings((prev) => [
          ...prev,
          { tool: 'eraser', points: currentPath, width: brushSize, erase: true },
        ]);
    } else if (drawTool === 'pen') {
      if (currentPath.length > 1)
        setDrawings((prev) => [
          ...prev,
          { tool: 'pen', points: currentPath, color: drawColor, width: brushSize },
        ]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleMouseUp = () => {
    if (mode === 'draw') finalizeDrawing();
    setDragging(false);
  };

  /* ---------- JSX ---------- */
  return (
    <div>
      {/* Top controls */}
      <div style={{ marginBottom: '8px' }}>
        <label>
          Mode:&nbsp;
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="write">Write</option>
            <option value="draw">Draw</option>
          </select>
        </label>

        {mode === 'draw' && (
          <span style={{ marginLeft: '16px' }}>
            {/* Tool */}
            <label>
              Tool:&nbsp;
              <select value={drawTool} onChange={(e) => setDrawTool(e.target.value)}>
                <option value="pen">Pen</option>
                <option value="line">Line</option>
                <option value="circle">Circle</option>
                <option value="arrow">Arrow</option>
                <option value="eraser">Eraser</option>
              </select>
            </label>

            {/* Colour */}
            {drawTool !== 'eraser' && (
              <label style={{ marginLeft: '12px' }}>
                Colour:&nbsp;
                <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} />
              </label>
            )}

            {/* Brush size */}
            <label style={{ marginLeft: '12px' }}>
              Size:&nbsp;
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
            </label>

            {/* Undo / Redo */}
            <button onClick={handleUndo} disabled={!undoStack.length} style={{ marginLeft: '12px' }}>
              Undo
            </button>
            <button onClick={handleRedo} disabled={!redoStack.length} style={{ marginLeft: '4px' }}>
              Redo
            </button>
          </span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          border: '1px solid black',
          cursor:
            mode === 'draw'
              ? drawTool === 'line' || drawTool === 'arrow' || drawTool === 'circle'
                ? 'crosshair'
                : 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAGCAYAAADatz7PAAAAIElEQVQYlWP8//8/AzVgYGBgePfuXQGsggERZWUlBjAxMTH4BQBtMQoHm7PVmQAAAABJRU5ErkJggg==) 3 3, auto'
              : 'text',
        }}
      />

      {/* Floating text editor */}
      {selectedIndex !== null && mode === 'write' && (
        <div
          style={{
            position: 'absolute',
            top: editorPos.y,
            left: editorPos.x,
            background: '#fff',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            zIndex: 10,
            fontSize: '12px',
            width: '180px',
          }}
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            style={{ marginBottom: '4px', width: '100%' }}
          />
          <select value={font} onChange={(e) => setFont(e.target.value)} style={{ width: '100%', marginBottom: '4px' }}>
            <option value="20px Arial">Arial</option>
            <option value="20px Georgia">Georgia</option>
            <option value="20px Courier New">Courier New</option>
            <option value="20px Comic Sans MS">Comic Sans</option>
          </select>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ marginBottom: '6px' }} />
          <label style={{ display: 'block', marginBottom: '2px' }}>
            Rotate
            <input
              type="range"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            Scale
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>
          <button onClick={updateText} style={{ width: '100%' }}>
            Update
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageEditorGPT;