import { useLayoutEffect, useRef, useState } from "react";
import { CanvasContexts } from "./useCanvasLayerRefs";
import { hasAllLayers } from "../utils/helpers";

export const useElementResizeObserver = (
    ref: React.RefObject<HTMLElement | null>,
    contexts: CanvasContexts,
    onResize: (size: DOMRectReadOnly) => void,
    debounceMs = 100
): { width: number, height: number } => {
    const [size, setSize] = useState({ width: 0, height: 0 });
    const timeoutRef = useRef<number | null>(null);

    useLayoutEffect(() => {
        const el = ref.current;
        
        if (!el) return;

        if(!hasAllLayers(contexts)) return;

        const observer = new ResizeObserver(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = window.setTimeout(() => {
                const rect = el.getBoundingClientRect();
                setSize({ width: rect.width, height: rect.height });
                onResize(rect);
            }, debounceMs);
        });

        observer.observe(el);

        return () => {
            observer.disconnect();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [contexts]);

    return size;
};