import { useRef, useState, useCallback } from 'react';
import { Point } from './useEditorEngine.types';

export interface ScaleSettings {
    flipHorizontal: boolean,
    flipVertical: boolean,
    zoom: number,
    rotate: number,
    offset: Point
}

const useScaleSettings = (initial?: Partial<ScaleSettings>) => {
    const defaultSettings: ScaleSettings = {
        flipHorizontal: false,
        flipVertical: false,
        zoom: 1,
        rotate: 0,
        offset: {x: 0, y: 0},
        ...initial,
    };

    const [uiState, setUiState] = useState<ScaleSettings>(defaultSettings);
    const ref = useRef<ScaleSettings>(defaultSettings);

    const update = useCallback((settings: Partial<ScaleSettings>) => {
        ref.current = { ...ref.current, ...settings};
        setUiState((prev) => ({ ...prev, ...settings}));
    }, []);

    return {
        ref,
        ui: uiState,
        update,
        reset: () => {
            ref.current = {...ref.current, ...defaultSettings};
            setUiState({...ref.current, ...defaultSettings});
        }
    };
}

export default useScaleSettings;