import { useRef, useState, useCallback } from 'react';

export interface ScaleSettings {
    flipHorizontal: boolean,
    flipVertical: boolean,
    zoom: number,
    rotate: number
}

const useScaleSettings = (initial?: Partial<ScaleSettings>) => {
    const defaultSettings: ScaleSettings = {
        flipHorizontal: false,
        flipVertical: false,
        zoom: 1,
        rotate: 0,
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
    };
}

export default useScaleSettings;