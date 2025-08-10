import { useRef, useState, useCallback } from 'react';

export interface FilterSettings {
    brightness: number,
    contrast: number,
    saturate: number,
    grayscale: number
}

const useFilterSettings = (initial?: Partial<FilterSettings>) => {
    const defaultSettings: FilterSettings = {
        brightness: 100,
        contrast: 100,
        saturate: 100,
        grayscale: 0,
        ...initial,
    };

    const [uiState, setUiState] = useState<FilterSettings>(defaultSettings);
    const ref = useRef<FilterSettings>(defaultSettings);

    const update = useCallback((settings: Partial<FilterSettings>) => {
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

export default useFilterSettings;