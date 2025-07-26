import { TranslationsProps } from "./ImageEditor.types";
import { DrawingItemProps, PointProps, TextItemProps } from "./usePhotoEditor.types";

export const WRAP_WIDTH = 200;

export const initialCords = {x: 0, y: 0};
export enum MODES {
    DRAW='draw',
    PAN='pan',
    WRITE='write',
}
export enum DRAW_TOOLS {
    PEN='pen',
    LINE='line',
    CIRCLE='circle',
    ARROW='arrow',
    ERASER='eraser'
}

export enum FILTERS {
    BRIGHTNESS = 'brightness',
    CONTRAST = 'contrast',
    SATURATE = 'saturate',
    GRAYSCALE = 'grayscale',
    FLIPHORIZONTAL = 'flipHorizontal',
    FLIPVERTICAL = 'flipVertical',
    ZOOM = 'zoom',
    ROTATE = 'rotate',
}

export const getLines = (context: CanvasRenderingContext2D, txt: string, fnt: string) => {
    context.font = fnt;
    const words = txt.split(' ');
    const lines: string[] = [];
    let line = '';
    
    words.forEach((w, idx) => {
        const test = line ? `${line} ${w}` : w;
        
        if(context.measureText(test).width > WRAP_WIDTH && line){
            lines.push(line);
            line = w;
        }else {
            line = test;
        }
        
        if(idx === words.length - 1) lines.push(line);
    });
    
    return lines;
};

export const getMetrics = (t: TextItemProps, ctx: CanvasRenderingContext2D) => {
    if (!ctx) return { lines: [], width: 0, height: 0, lineHeight: 0 };
    
    ctx.font = t.font;
    const lines = getLines(ctx, t.text, t.font);
    const lineHeight = parseInt(t.font, 10);
    const width = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const height = lineHeight * lines.length;
    
    return { lines, width, height, lineHeight };
};

export const ptToPx = (pt: number): number => pt * (96 / 72);

export const getCanvasPtToPx = (ptSize: number): number => {
    return ptToPx(ptSize);
};

export const isInsideWrite = (pos: PointProps, t: TextItemProps, ctx: CanvasRenderingContext2D) => {
    if (!ctx) return false;
    
    const { width, height } = getMetrics(t, ctx);
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

export const getMousePos = (
    e: React.MouseEvent<HTMLCanvasElement>, 
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    editorOffset: PointProps,
    zoom: number,
    flipX: boolean,
    flipY: boolean,
    rotate: number
): PointProps => {
    const defaultPos = initialCords;

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

    const translateX = (canvas.width - zoomedWidth) / 2 + editorOffset.x;
    const translateY = (canvas.height - zoomedHeight) / 2 + editorOffset.y;

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

export const drawLine = (ctx: CanvasRenderingContext2D, drawing: DrawingItemProps) => {
    const [p0, p1] = drawing.points;

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
}

export const drawLineMove = (ctx: CanvasRenderingContext2D, path: PointProps[]) => {
    const [p0, p1] = path;

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
}

export const drawCircle = (ctx: CanvasRenderingContext2D, drawing: DrawingItemProps) => {
    const [center, edge] = drawing.points;
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
    
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
}

export const drawCircleMove = (ctx: CanvasRenderingContext2D, path: PointProps[]) => {
    const [center, edge] = path;
    const radius = Math.hypot(edge.x - center.x, edge.y - center.y);

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
}

export const drawArrow = (ctx: CanvasRenderingContext2D, drawing: DrawingItemProps) => {
    const [p0, p1] = drawing.points;

    const headSize = 8 + drawing.width * 1.5;

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
    const [left, right, tip] = drawArrowHead(shaftEnd, p1, headSize, drawing.width);

    // Draw the arrowhead
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fillStyle = drawing.color || 'black';
    ctx.fill();
}

export const drawArrowMove = (ctx: CanvasRenderingContext2D, path: PointProps[], brushSize: number, drawColor: string) => {
    const [p0, p1] = path;

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
}

export const drawArrowHead = (
    p0: PointProps,
    p1: PointProps,
    size: number,
    strokeWidth: number = 1
): [PointProps, PointProps, PointProps] => {
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

export const drawPath = (ctx: CanvasRenderingContext2D, drawing: DrawingItemProps) => {
    if (drawing.points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
    
    drawing.points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    
    ctx.stroke();
}

export const drawPathMove = (ctx: CanvasRenderingContext2D, path: PointProps[]) => {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();
}

export const drawText = (ctx: CanvasRenderingContext2D, textItem: TextItemProps) => {
    const { lines, lineHeight } = getMetrics(textItem, ctx);

    ctx.save();
    ctx.translate(textItem.x, textItem.y);
    ctx.rotate((textItem.rotation * Math.PI) / 180);
    ctx.scale(textItem.scale, textItem.scale);
    ctx.font = textItem.font;
    ctx.fillStyle = textItem.color;
    lines.forEach((ln, idx) => ctx.fillText(ln, 0, idx * lineHeight));
}

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

export const labels : TranslationsProps = {
    arrow: {txt: 'Arrow'},
    brightness: {txt: 'Brightness'},
    brushColor: {txt: 'Brush color'},
    brushWidth: {txt: 'Brush width'},
    circle: {txt: 'Circle'},
    contrast: {txt: 'Contrast'},
    controls: {txt: 'Controls'},
    draw: {txt: 'Draw'},
    emptySelect: {txt: 'No options selected'},
    eraser: {txt: 'Eraser'},
    flip: {txt: 'Flip'},
    grayscale: {txt: 'Grayscale'},
    horizontal: {txt: 'Horizontally'},
    line: {txt: 'Line'},
    pan: {txt: 'Pan'}, //Mover / Arrastar
    pen: {txt: 'Pen'},
    reset: {txt: 'Reset'},
    rotate: {txt: 'Rotate'},
    saturate: {txt: 'Saturate'},
    save: {txt: 'Save'},
    vertical: {txt: 'Vertically'},
    zoom: {txt: 'Zoom'},
    write: {txt: 'Write'},
}