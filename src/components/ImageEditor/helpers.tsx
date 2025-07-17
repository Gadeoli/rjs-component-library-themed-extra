import { TranslationsProps } from "./ImageEditor.types";
import { PointProps, TextItemProps } from "./usePhotoEditor.types";

export const WRAP_WIDTH = 200;
export const initialCords = {x: 0, y: 0};

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

export const isInside = (pos: PointProps, t: TextItemProps, ctx: CanvasRenderingContext2D) => {
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

export const drawArrowHead = (p0: PointProps, p1: PointProps, size: number): [PointProps, PointProps] => {
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

export const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>, canvasRef: React.RefObject<HTMLCanvasElement | null>): PointProps => {
    const defaultPos = initialCords;

    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();

    if (!canvas || !rect) return defaultPos;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return { 
        x: (e.clientX - rect.left) * scaleX, 
        y: (e.clientY - rect.top) * scaleY 
    };
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
    pan: {txt: 'Pan & Zoom'}, //Mover / Arrastar
    pen: {txt: 'Pen'},
    reset: {txt: 'Reset'},
    rotate: {txt: 'Rotate'},
    saturate: {txt: 'Saturate'},
    save: {txt: 'Save'},
    vertical: {txt: 'Vertically'},
    zoom: {txt: 'Zoom'},
    write: {txt: 'Write'},
}