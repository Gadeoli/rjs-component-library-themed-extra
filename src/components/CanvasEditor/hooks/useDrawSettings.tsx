import { useRef, useState, useCallback } from 'react';

export enum DRAW_TOOLS {
    PEN='pen',
    LINE='line',
    CIRCLE='circle',
    ARROW='arrow',
    ERASER='eraser'
}

export type Tool = DRAW_TOOLS.PEN | DRAW_TOOLS.LINE | DRAW_TOOLS.CIRCLE | DRAW_TOOLS.ARROW | DRAW_TOOLS.ERASER;

export interface DrawSettings {
    color: string;
    size: number;
    tool: Tool;
}

const useDrawSettings = (initial?: Partial<DrawSettings>) => {
    const defaultSettings: DrawSettings = {
        color: '#000000',
        size: 4,
        tool: DRAW_TOOLS.PEN,
        ...initial,
    };

    const [uiState, setUiState] = useState<DrawSettings>(defaultSettings);
    const ref = useRef<DrawSettings>(defaultSettings);

    const update = useCallback((settings: Partial<DrawSettings>) => {
        ref.current = { ...ref.current, ...settings };
        setUiState((prev) => ({ ...prev, ...settings }));
    }, []);

    return {
        ref,
        ui: uiState,
        update,
    };
}

export default useDrawSettings;