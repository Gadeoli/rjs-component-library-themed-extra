import uuid from "../../../helpers/uuid";
import { CanvasContexts, CanvasRefs } from "../hooks/useCanvasLayerRefs";
import { DRAW_TOOLS } from "../hooks/useDrawSettings";
import { Command, DrawingObject, EditorState, FilterObject, Point, ScaleObject, TextObject } from "../hooks/useEditorEngine.types";
import { ScaleSettings } from "../hooks/useScaleSettings";

export const initialPoint = {x: 0, y: 0};

export const hasAllLayers = (ctxs: CanvasContexts) : ctxs is CanvasContexts & { background: HTMLCanvasElement, drawings: HTMLCanvasElement, texts: HTMLCanvasElement, interactions: HTMLCanvasElement } => ctxs.background !== null && ctxs.drawings !== null && ctxs.texts !== null && ctxs.interactions !== null;

export const renderEditorState = (state: EditorState, ctxs: CanvasContexts) => {
    if (!hasAllLayers(ctxs)) return;

    renderAllLayer(state, ctxs); //should be first
    renderBackgroundLayer(state, ctxs.background);
    renderDrawingsLayer(state, ctxs.drawings);
    renderTextsLayer(state, ctxs.texts);
}

export const renderBackgroundLayer = (state: EditorState, ctx: CanvasRenderingContext2D) => {
    if(state.backgroundImage){
        const w = state.backgroundImage.width;
        const h = state.backgroundImage.height;

        const filters = state.objects.filter(obj => obj.type === "filter");

        if(filters.length){
            applyFilters(ctx, filters[filters.length - 1]);
        }

        ctx.drawImage(state.backgroundImage, 0, 0, w, h);
        ctx.restore();
    }else{
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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

export const renderAllLayer = (state: EditorState, ctxs: CanvasContexts) => {
    const scales = state.objects.filter(obj => obj.type === "scale");

    if(scales.length){
        applyScales(ctxs, scales[scales.length - 1], state.backgroundImage);
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

export const updateFiltersCommand = (filtering: FilterObject): Command => {
    const id = uuid(); 

    return {
        id,
        label: 'background-filter-change',
        do: (state) => ({
            ...state,
            objects: [...state.objects, filtering],
        }),
        undo: (state) => ({
            ...state,
            objects: state.objects.filter(obj => obj.id !== id)
        }),
        affectedLayers: ["background"],
    };
}

export const updateScalesCommand = (scalling: ScaleObject): Command => {
    const id = uuid();

    return {
        id,
        label: 'canvas-scale-change',
        do: (state) => ({
            ...state,
            objects: [...state.objects, scalling],
        }),
        undo: (state) => ({
            ...state,
            objects: state.objects.filter(obj => obj.id !== id)
        }),
        affectedLayers: "all",
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

    if(!obj.erase){
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

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

export const applyFilters = (
    ctx: CanvasRenderingContext2D,
    obj: FilterObject
) => {
    const {
        brightness,
        contrast,
        grayscale,
        saturate
    } = obj.values;

    const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) saturate(${saturate}%)`;

    ctx.filter = filterStyle;
    ctx.save();
}

export const applyScales = (
    ctxs: CanvasContexts,
    obj: ScaleObject,
    bgImage: HTMLImageElement | null
) => {
    const { rotate, zoom } = obj.values;

    const w = bgImage?.width || 0;
    const h = bgImage?.height || 0;

    const zoomW = w * obj.values.zoom; 
    const zoomH = h * obj.values.zoom;

    const translateX = (w - zoomW) / 2;
    const translateY = (h - zoomH) / 2;

    for(const key in ctxs){
        const ctx = ctxs[key as keyof typeof ctxs];

        if(ctx){
            //reset ctx
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);        
            ctx.setTransform(1, 0, 0, 1, 0, 0);    

            if(rotate){
                const centerX = ctx.canvas.width / 2;
                const centerY = ctx.canvas.height / 2;
                const angle = (rotate * Math.PI) / 180;

                ctx.translate(centerX, centerY);
                ctx.rotate(angle);
                ctx.translate(-centerX, -centerY);
            }

            if (obj.values.flipHorizontal) {
                ctx.translate(ctx.canvas.width, 0);
                ctx.scale(-1, 1);
            }

            if (obj.values.flipVertical) {
                ctx.translate(0, ctx.canvas.height);
                ctx.scale(1, -1);
            }

            ctx.translate(translateX + obj.values.offset.x, translateY + obj.values.offset.y);
            ctx.scale(zoom, zoom);
            ctx.filter = 'none';
            ctx.save();
        }
    }
}

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
    scaleSettings: ScaleSettings
): Point => {
    const defaultPos = initialPoint;

    const {
        flipHorizontal,
        flipVertical,
        zoom,
        rotate,
        offset
    } = scaleSettings
    
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
    if (flipHorizontal) x = canvas.width - x;
    if (flipVertical) y = canvas.height - y;

    // Undo rotation (about center)
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
 * @param canvasRefs 
 * @param image 
 * @param containerSizes 
 * @param fixCssWidth canvas width respect container size in %. If canvas css is setted to bellow 100% than use this fix (ex.: 0.8 to 80%)
 */
export const setCanvasSizeFromImage = (
    canvasRefs: CanvasRefs,
    image: HTMLImageElement,
    containerSizes: any,
    fixCssWidth=1
) => {
    //image
    const w = image.width;
    const h = image.height;
    const ratioI = w / h;
    
    //canvas container
    const cw = (containerSizes?.width || 0) * fixCssWidth;
    const ch = (containerSizes?.height || 0);
    const ratioC = cw / ch;

    //canvas
    let cvStyleH = ch;
    let cvStyleW = cw * (ratioI / ratioC);

    //fix canvas container ratio (reducing canvas style height)
    if(cvStyleW > cw){
        cvStyleH = cw * cvStyleH / cvStyleW;
    }

    //document
    const dpr = window.devicePixelRatio || 1;

    /*
    console.log({
        cw,
        ch,
        w,
        h,
        cvStyleW,
        cvStyleH,
        ratioI,
        ratioC,
    });
    */

    for (const key in canvasRefs) {
        const canvas = canvasRefs[key as keyof CanvasRefs]?.current;
        
        if (canvas) {
            let canvasH = h;
            let canvasW = w;
            
            //Apply fixes in canvasH and canvasW
            //zoom fix, panning fix etc...

            canvas.width = canvasW;
            canvas.height = canvasH;

            canvas.style.width = `${cvStyleW}px`;
            canvas.style.height = `${cvStyleH}px`;
        }
    }
} 

export const getBiggerSize = (obj : HTMLImageElement | HTMLCanvasElement) : number => {
    const biggerSize = obj.width > obj.height ? obj.width : obj.height;    
    return biggerSize;
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

export const defaultLabels = {
    arrow: {txt: 'Arrow'},
    brightness: {txt: 'Brightness'},
    cancel: {txt: 'Cancel'},
    circle: {txt: 'Circle'},
    contrast: {txt: 'Contrast'},
    draw: {txt: 'Draw'},
    filters: {txt: 'Filters'},
    grayscale: {txt: 'Grayscale'},
    settings: {txt: 'Tools'},
    eraser: {txt: 'Eraser'},
    line: {txt: 'Line'},
    pan_zoom: {txt: 'Pan & Zoom'},
    pen: {txt: 'Pen'},
    redo: {txt: 'Redo'},
    restore: {txt: 'Restore'},
    rotate: {txt: 'Rotate'},
    saturate: {txt: 'Saturate'},
    save: {txt: 'Save'},
    shapes: {txt: 'Shapes'},
    undo: {txt: 'Undo'},
    zoom: {txt: 'Zoom'}
}