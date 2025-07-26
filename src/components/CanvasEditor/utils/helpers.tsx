import uuid from "../../../helpers/uuid";
import { CanvasContexts } from "../hooks/useCanvasLayerRefs";
import { DRAW_TOOLS } from "../hooks/useDrawSettings";
import { Command, DrawingObject, EditorState, Point, TextObject } from "../hooks/useEditorEngine.types";

export const initialPoint = {x: 0, y: 0};

const hasAllLayers = (ctxs: CanvasContexts) : ctxs is CanvasContexts & { background: HTMLCanvasElement, drawings: HTMLCanvasElement, texts: HTMLCanvasElement, interactions: HTMLCanvasElement } => ctxs.background !== null && ctxs.drawings !== null && ctxs.texts !== null && ctxs.interactions !== null;

export const renderEditorState = (state: EditorState, ctxs: CanvasContexts) => {
    if (!hasAllLayers(ctxs)) return;

    renderBackgroundLayer(state, ctxs);
    renderDrawingsLayer(state, ctxs.drawings);
    renderTextsLayer(state, ctxs.texts);
}

export const renderBackgroundLayer = (state: EditorState, ctxs: CanvasContexts) => {
    if (!hasAllLayers(ctxs)) return;

    const bgCanvas = ctxs.background.canvas;
    const drawCanvas = ctxs.drawings.canvas;
    const textCanvas = ctxs.texts.canvas;
    const interCanvas = ctxs.interactions.canvas;

    if(state.backgroundImage){
        const w = state.backgroundImage.width;
        const h = state.backgroundImage.height;

        bgCanvas.width = w;
        bgCanvas.height = h;

        drawCanvas.width = w;
        drawCanvas.height = h;

        textCanvas.width = w;
        textCanvas.height = h;

        interCanvas.width = w;
        interCanvas.height = h;
        
        ctxs.background.drawImage(state.backgroundImage, 0, 0, w, h);
    }
}

export const renderDrawingsLayer = (state: EditorState, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const obj of state.objects) {
        if (obj.type === "drawing") {
            if([DRAW_TOOLS.PEN, DRAW_TOOLS.ERASER].includes(obj.tool)){
                drawPathObject(ctx, obj);
            }else if(obj.tool === DRAW_TOOLS.LINE){
                drawLine(ctx, obj);
            }else if(obj.tool === DRAW_TOOLS.ARROW){
                drawArrow(ctx, obj);
            }else if(obj.tool === DRAW_TOOLS.CIRCLE){
                drawCircle(ctx, obj);
            }
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
        do: (state) => ({
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

export const setBackgroundImageCommand = (
    image: HTMLImageElement,
    prevImage: HTMLImageElement | null
): Command => {
    const id = uuid(); 

    return {
        id,
        label: 'background-image-set',
        do: (state) => ({
            ...state,
            backgroundImage: image,
        }),
        undo: (state) => ({
            ...state,
            backgroundImage: prevImage
        }),
        affectedLayers: ["background"],
    };
}

const drawPathObject = (ctx: CanvasRenderingContext2D, obj: DrawingObject) => {
    const { points } = obj;

    if (points.length < 2) return;

    ctx.beginPath();
    styleCtx(ctx, obj);
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < obj.points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
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
    obj: Partial<DrawingObject>
) => {
    const { points } = obj;

    if(!points) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    styleCtx(ctx, obj);

    if (points.length === 1) {
        // Just a dot
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
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

export const drawLine = (
    ctx: CanvasRenderingContext2D,
    obj: Partial<DrawingObject>
) => {
    const { points } = obj;

    if(!points) return;

    const [p0, p1] = points;

    ctx.beginPath();
    styleCtx(ctx, obj);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
}

export const drawCircle = (
    ctx: CanvasRenderingContext2D,
    obj: Partial<DrawingObject>
) => {
    const { points } = obj;

    if(!points) return;

    const [center, edge] = points;
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
    
    ctx.beginPath();
    styleCtx(ctx, obj);
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
}

export const drawArrow = (
    ctx: CanvasRenderingContext2D,
    obj: Partial<DrawingObject>
) => {
    const { points } = obj;

    if(!points) return;

    styleCtx(ctx, obj);

    const [p0, p1] = points;
    const headSize = 8 + ctx.lineWidth * 1.5;

    // Calculate unit direction vector from p0 to p1
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const length = Math.hypot(dx, dy);

    const unitX = dx / length;
    const unitY = dy / length;

    // Trimmed end of the shaft (p1 shifted back by headSize)
    const shaftEnd = {
        x: p1.x - unitX * headSize,
        y: p1.y - unitY * headSize,
    };

    // Draw the shaft
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(shaftEnd.x, shaftEnd.y);
    ctx.stroke();

    // Compute arrowhead based on shaftEnd → p1 direction
    const [left, right, tip] = drawArrowHead(shaftEnd, p1, headSize, ctx.lineWidth);

    // Draw the arrowhead
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill();
}

export const drawArrowHead = (
    p0: Point,
    p1: Point,
    size: number,
    strokeWidth: number = 1
): [Point, Point, Point] => {
    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);

    // Ensure arrowhead is wide enough relative to line thickness
    const headLength = size;
    const headWidth = Math.max(size * 1.5, strokeWidth * 2.5); // ensures visible triangle

    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    // Arrowhead tip is at p1
    const tip = { x: p1.x, y: p1.y };

    const left = {
        x: p1.x - headLength * cos + (headWidth / 2) * sin,
        y: p1.y - headLength * sin - (headWidth / 2) * cos,
    };

    const right = {
        x: p1.x - headLength * cos - (headWidth / 2) * sin,
        y: p1.y - headLength * sin + (headWidth / 2) * cos,
    };

    return [left, right, tip];
};

export const styleCtx = (
    ctx: CanvasRenderingContext2D,
    obj: Partial<DrawingObject>
) => {
    const {
        color,
        brushSize,
        erase
    } = obj;

    if(erase){
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.globalCompositeOperation = 'destination-out';
    }else{
        ctx.strokeStyle = color || '#000000';
        ctx.fillStyle = color || '#000000';
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.lineWidth = brushSize || 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
}

export const clearLayer = (
    ctx: CanvasRenderingContext2D
) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
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

/**
 * Generates a image source from the canvas content.
 * @returns {Promise<string | null>} A promise that resolves with the edited image src or null if the canvas is not available.
 */
export const generateCanvasImage = (canvasLayers : HTMLCanvasElement[], outputSizes: {width: number, height: number}) : Promise<string>  => {
    return new Promise((resolve) => {
        let cnvCounter = 0;

        const mergedCanvas = document.createElement('canvas');
        mergedCanvas.width = outputSizes.width;
        mergedCanvas.height = outputSizes.height;
        const mergedCtx = mergedCanvas.getContext('2d');

        canvasLayers.forEach((cnv) => {
            if(cnv){
                const dataURL = cnv.toDataURL();
                const image = new Image();

                image.onload = () => {
                    mergedCtx?.drawImage(image, 0, 0);
                    cnvCounter++;

                    if(cnvCounter === canvasLayers.length){
                        resolve(mergedCanvas.toDataURL('image/png'));
                    }
                }

                image.src = dataURL;
            }
        })
    });
}

export const defaultLabels = {
    arrow: {txt: 'Arrow'},
    cancel: {txt: 'Cancel'},
    circle: {txt: 'Circle'},
    draw: {txt: 'Draw'},
    settings: {txt: 'Tools'},
    eraser: {txt: 'Eraser'},
    line: {txt: 'Line'},
    pen: {txt: 'Pen'},
    redo: {txt: 'Redo'},
    restore: {txt: 'Restore'},
    save: {txt: 'Save'},
    shapes: {txt: 'Shapes'},
    undo: {txt: 'Undo'}
}