import uuid from "../../../helpers/uuid";
import { CanvasContexts } from "../hooks/useCanvasLayerRefs";
import { DrawSettings } from "../hooks/useDrawSettings";
import { Command, DrawingObject, EditorState, Point, TextObject } from "../hooks/useEditorEngine.types";

export const initialPoint = {x: 0, y: 0};

export const renderEditorState = (state: EditorState, ctxs: CanvasContexts) => {
    const {
        background,
        drawings,
        texts,
        interactions
    } = ctxs;

    if (!background || !drawings || !texts || interactions) return;

    renderBackgroundLayer(state, background);
    renderDrawingsLayer(state, drawings);
    renderTextsLayer(state, texts);
}

export const renderBackgroundLayer = (state: EditorState, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (state.backgroundImage) {
        ctx.drawImage(state.backgroundImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export const renderDrawingsLayer = (state: EditorState, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const obj of state.objects) {
        if (obj.type === "drawing") {
            drawPathObject(ctx, obj);
        }
    }
}

export const renderTextsLayer = (state: EditorState, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const obj of state.objects) {
        if (obj.type === "text") {
            drawTextObject(ctx, obj);
        }
    }
}

export const addDrawingCommand = (drawing: DrawingObject) : Command => {
    const id = uuid(); 

    return {
        id,
        label: 'add-drawing',
        apply: (state) => ({
            ...state,
            objects: [...state.objects, drawing],
        }),
        undo: (state) => ({
            ...state,
            objects: state.objects.filter(obj => obj.id !== id)
        }),
        affectedLayers: ["drawings"],
    };
}

const drawPathObject = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    if (obj.points.length < 2) return;

    ctx.beginPath();
    ctx.lineWidth = obj.brushSize;
    ctx.strokeStyle = obj.color;
    ctx.lineCap = 'round';
    ctx.moveTo(obj.points[0].x, obj.points[0].y);

    for (let i = 1; i < obj.points.length; i++) {
        ctx.lineTo(obj.points[i].x, obj.points[i].y);
    }

    ctx.stroke();
}

export const drawTextObject = (ctx: CanvasRenderingContext2D, obj: TextObject) => {
    ctx.font = `${obj.fontSize}px sans-serif`;
    ctx.fillStyle = obj.color;
    ctx.textBaseline = 'top';
    ctx.fillText(obj.text, obj.position.x, obj.position.y);
}

export const drawStroke = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    options: DrawSettings
) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();

    ctx.strokeStyle = options.color;
    ctx.fillStyle = options.color;
    ctx.lineWidth = options.size;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (points.length === 1) {
        // Just a dot
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, options.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = options.color;
        ctx.fill();
    } else if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    ctx.restore();
}

export const clearLayer = (
    ctx: CanvasRenderingContext2D
) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
}

export const defaultLabels = {
    draw: {txt: 'Draw'}
}

export const getMousePos = (
    e: React.MouseEvent<HTMLCanvasElement>, 
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    offset: Point = initialPoint,
    zoom: number = 1,
    flipX: boolean = false,
    flipY: boolean = false,
    rotate: number = 0,
): Point => {
    const defaultPos = initialPoint;
    
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();

    if (!canvas || !rect) return defaultPos;

    // Convert to internal canvas space
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Mouse position relative to canvas in screen space && apply scale
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;

    const zoomedWidth = canvas.width * zoom;
    const zoomedHeight = canvas.height * zoom;

    const translateX = (canvas.width - zoomedWidth) / 2 + offset.x;
    const translateY = (canvas.height - zoomedHeight) / 2 + offset.y;

    // Fix offset (panning)
    x -= translateX;
    y -= translateY;

    // Apply zoom correction
    x /= zoom;
    y /= zoom;

    // Apply flip correction
    if (flipX) x = canvas.width - x;
    if (flipY) y = canvas.height - y;

    // Step 5: undo rotation (about center)
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    
    const angle = (rotate * Math.PI) / 180;
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);

    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;

    // Move back from origin
    x = rotatedX + cx;
    y = rotatedY + cy;

    return { x, y };
};