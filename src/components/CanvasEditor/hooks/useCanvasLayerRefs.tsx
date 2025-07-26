import { useRef, useEffect, useMemo, useState } from "react";

type CanvasLayers = "background" | "drawings" | "texts" | "interactions";

export type CanvasRefs = Record<CanvasLayers, React.RefObject<HTMLCanvasElement | null>>;
export type CanvasContexts = Record<CanvasLayers, CanvasRenderingContext2D | null>;

export function useCanvasLayerRefs(containerRef: React.RefObject<HTMLElement | null>) {
    const backgroundRef = useRef<HTMLCanvasElement | null>(null);
    const drawingsRef = useRef<HTMLCanvasElement | null>(null);
    const textsRef = useRef<HTMLCanvasElement | null>(null);
    const interactionsRef = useRef<HTMLCanvasElement | null>(null);

    const canvasRefs: CanvasRefs = useMemo(() => ({
        background: backgroundRef,
        drawings: drawingsRef,
        texts: textsRef,
        interactions: interactionsRef,
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