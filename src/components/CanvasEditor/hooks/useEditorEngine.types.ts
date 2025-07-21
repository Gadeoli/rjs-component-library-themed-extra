export type Point = { x: number; y: number };

export type DrawingObject = {
    id: string;
    type: 'drawing';
    points: Point[];
    color: string;
    brushSize: number;
};

export type TextObject = {
    id: string;
    type: 'text';
    text: string;
    position: Point;
    fontSize: number;
    color: string;
};

export type CanvasObject = DrawingObject | TextObject;

export interface EditorState {
    backgroundImage: HTMLImageElement | null;
    objects: CanvasObject[]; // in render order
    selectedObjectIds: string[];
}

export type Command = {
    id: string;
    label?: string;
    apply: (state: EditorState) => EditorState;
    undo: (state: EditorState) => EditorState;
    affectedLayers: ("background" | "drawings" | "texts")[] | "all";
}

export enum MODES {
    DRAW='draw',
    // PAN='pan',
    // WRITE='write',
}