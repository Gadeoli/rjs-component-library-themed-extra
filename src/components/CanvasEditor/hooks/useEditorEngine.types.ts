import { Tool } from "./useDrawSettings";

export type Point = { x: number; y: number };

export type DrawingObject = {
    id: string;
    type: 'drawing';
    tool: Tool;
    points: Point[];
    color: string;
    brushSize: number;
    erase: boolean;
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

export interface EditorConfig {
    fixCssWidth?: number;
}

export type Command = {
    id: string;
    label?: string;
    do: (state: EditorState) => EditorState;
    undo: (state: EditorState) => EditorState;
    affectedLayers: ("background" | "drawings" | "texts")[] | "all";
}