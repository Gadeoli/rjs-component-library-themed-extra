import uuid from "../../../helpers/uuid";
import { CanvasContexts } from "../hooks/useCanvasLayerRefs";
import { Command, DrawingObject, EditorState, TextObject } from "../hooks/useEditorEngine.types";

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
    return {
        id: uuid(),
        label: 'add-drawing',
        apply: (state) => ({
            ...state,
            objects: [...state.objects, drawing],
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

const drawTextObject = (ctx: CanvasRenderingContext2D, obj: TextObject) => {
    ctx.font = `${obj.fontSize}px sans-serif`;
    ctx.fillStyle = obj.color;
    ctx.textBaseline = 'top';
    ctx.fillText(obj.text, obj.position.x, obj.position.y);
}

export const defaultLabels = {
    
}