import { useRef, useEffect, useMemo, useState } from "react";

type CanvasLayers = "background" | "drawings" | "texts" | "interactions";

type CanvasRefs = Record<CanvasLayers, React.RefObject<HTMLCanvasElement | null>>;
export type CanvasContexts = Record<CanvasLayers, CanvasRenderingContext2D | null>;

export function useCanvasLayerRefs(containerRef: React.RefObject<HTMLElement | null>) {
    const canvasRefs: CanvasRefs = useMemo(() => ({
        background: useRef<HTMLCanvasElement | null>(null),
        drawings: useRef<HTMLCanvasElement | null>(null),
        texts: useRef<HTMLCanvasElement | null>(null),
        interactions: useRef<HTMLCanvasElement | null>(null),
    }), []);

    const [contexts, setContexts] = useState<CanvasContexts>({
        background: null,
        drawings: null,
        texts: null,
        interactions: null,
    });

    useEffect(() => {
        const resizeAndSetup = () => {
        const container = containerRef.current;
        
        if (!container) return;

            const { width, height } = container.getBoundingClientRect();

            for (const key of Object.keys(canvasRefs) as CanvasLayers[]) {
                const canvas = canvasRefs[key].current;
                
                if (!canvas) continue;

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                
                if (ctx) {
                    ctx.clearRect(0, 0, width, height);
                }
            }

            setContexts({
                background: canvasRefs.background.current?.getContext("2d") || null,
                drawings: canvasRefs.drawings.current?.getContext("2d") || null,
                texts: canvasRefs.texts.current?.getContext("2d") || null,
                interactions: canvasRefs.interactions.current?.getContext("2d") || null,
            });
        };

        resizeAndSetup();
        window.addEventListener("resize", resizeAndSetup);

        return () => window.removeEventListener("resize", resizeAndSetup);
    }, [containerRef, canvasRefs]);

    return {
        canvasRefs,
        contexts,
    };
}