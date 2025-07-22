import { useRef, useState, useCallback } from 'react';

export enum MODES {
    DRAW='draw',
    WRITE='write',
}

export type Mode = MODES.DRAW | MODES.WRITE;

export interface ActionSettings {
    mode: Mode;
    isDrawing: boolean;
    isInside: boolean;
    pointer: string
}

const useActionSettings = (initial?: Partial<ActionSettings>) => {
    const defaultSettings: ActionSettings = {
        mode: MODES.DRAW,
        isDrawing: false,
        isInside: false,
        pointer: 'default',
        ...initial,
    };

    const [actionState, setActionState] = useState<ActionSettings>(defaultSettings);
    const ref = useRef<ActionSettings>(defaultSettings);

    const update = useCallback((settings: Partial<ActionSettings>) => {
        const newPointer =  settings.mode === MODES.DRAW ? 'crosshair' : 'default';
        ref.current = { ...ref.current, ...settings, pointer: newPointer};
        setActionState((prev) => ({ ...prev, ...settings, pointer: newPointer}));
    }, []);

    return {
        ref,
        action: actionState,
        update,
    };
}

export default useActionSettings;