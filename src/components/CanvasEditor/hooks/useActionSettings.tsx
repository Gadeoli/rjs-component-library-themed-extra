import { useRef, useState, useCallback } from 'react';
import { Point } from './useEditorEngine.types';

export enum MODES {
    DRAW='draw',
    WRITE='write',
}

export type Mode = MODES.DRAW | MODES.WRITE;

export interface ActionSettings {
    mode: Mode;
    isDrawing: boolean;
    isInside: boolean;
    pointer: string;
    offset: Point;
}

const useActionSettings = (initial?: Partial<ActionSettings>) => {
    const defaultSettings: ActionSettings = {
        mode: MODES.DRAW,
        isDrawing: false,
        isInside: false,
        pointer: 'default',
        offset: {x: 0, y: 0},
        ...initial,
    };

    const [uiState, setUiState] = useState<ActionSettings>(defaultSettings);
    const ref = useRef<ActionSettings>(defaultSettings);

    const update = useCallback((settings: Partial<ActionSettings>) => {
        const newPointer =  settings.mode === MODES.DRAW ? 'crosshair' : 'default';
        ref.current = { ...ref.current, ...settings, pointer: newPointer};
        setUiState((prev) => ({ ...prev, ...settings, pointer: newPointer}));
    }, []);

    return {
        ref,
        ui: uiState,
        update,
    };
}

export default useActionSettings;