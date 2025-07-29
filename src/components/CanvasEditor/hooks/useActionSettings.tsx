import { useRef, useState, useCallback } from 'react';
import { Point } from './useEditorEngine.types';

export enum MODES {
    DRAW='draw',
    WRITE='write',
    PAN='panning',
}

export type Mode = MODES.DRAW | MODES.WRITE | MODES.PAN;

export interface ActionSettings {
    mode: Mode;
    isDrawing: boolean;
    isDragging: boolean;
    isInside: boolean;
    pointer: string;
    offset: Point;
}

const useActionSettings = (initial?: Partial<ActionSettings>) => {
    const defaultSettings: ActionSettings = {
        mode: MODES.DRAW,
        isDrawing: false,
        isDragging: false,
        isInside: false,
        pointer: 'default',
        offset: {x: 0, y: 0},
        ...initial,
    };

    const [uiState, setUiState] = useState<ActionSettings>(defaultSettings);
    const ref = useRef<ActionSettings>(defaultSettings);

    const update = useCallback((settings: Partial<ActionSettings>) => {
        const mode = settings.mode || ref.current.mode;

        const newPointer =  mode === MODES.DRAW ? 'crosshair' :
                            mode === MODES.PAN ? 'grab' :
                            'default';

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