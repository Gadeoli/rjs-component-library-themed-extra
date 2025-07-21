export interface DefaultProps {
    src?: string;
    values?: {
        filters: FiltersProps;
        scales: ScalesProps;
    }
    actions?: ActionsProps;
    labels?: LabelsProps; 
};

interface FiltersProps {
    brightness: number;
    contrast: number;
    saturate: number;
    grayscale: number;
};

interface ScalesProps {
    flipHorizontal: boolean;
    flipVertical: boolean;
    zoom: number;
    rotate: number;
};

export interface PointProps { x: number; y: number };

export type ModesType = 'pan' | 'draw' | 'flip' | 'write';

export type DrawToolsType = 'pen' | 'line' | 'circle' | 'arrow' | 'eraser';

interface ActionsProps {
    mode: ModesType;
    drawSettings: {
        tool: DrawToolsType;
        color: string;
        size: number;
    };
    writeSettings: TextItemProps;
};

export interface DrawingItemProps {
    tool: DrawToolsType;
    points: PointProps[]; // For line/arrow exactly 2 points, circle [center, edge], pen/eraser multiple points
    color?: string; // not needed for eraser
    width: number;
    erase?: boolean;
}

export interface TextItemProps {
    text: string;
    x: number;
    y: number;
    font: string;
    fontSize: number;
    color: string;
    rotation: number; // degrees
    scale: number;
};

export interface PansItemProps {
    points: PointProps[];
};

export interface UndoRedoItemProps {
    filters: string[];
    scales: string[];
    texts: TextItemProps[];
    drawings: DrawingItemProps[];
    pans: PansItemProps[];
};

export interface LabelsProps {
    writeInitial: string;
};