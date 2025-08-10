import { Tool } from "./useDrawSettings";
import { FilterSettings } from "./useFilterSettings";
import { ScaleSettings } from "./useScaleSettings";

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

export type FilterObject = {
    id: string;
    type: 'filter';
    values: FilterSettings;
};

export type ScaleObject = {
    id: string;
    type: 'scale';
    values: ScaleSettings;
};

export type CanvasObject = DrawingObject | TextObject | FilterObject | ScaleObject;

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