import { 
    useCallback,
    useEffect,
    useMemo,
    useRef, 
    useState
} from "react";
import { 
    Command,
    EditorConfig,
    EditorState
} from "./useEditorEngine.types";
import { 
    addDrawingCommand,
    clearLayer,
    drawArrow,
    drawCircle,
    drawLine,
    drawStroke,
    generateCanvasImage,
    getBiggerSize,
    getMousePos,
    renderEditorState, 
    setBackgroundImageCommand,
    setCanvasSizeFromImage,
    updateFiltersCommand,
    updateScalesCommand
} from "../utils/helpers";
import { useCanvasLayerRefs } from "./useCanvasLayerRefs";
import createEditorEngine from "../utils/engine";
import { EditorEngine } from "../utils/engine.types";
import useCurrentPath from "./useCurrentPath";
import useDrawSettings, { DRAW_TOOLS, DrawSettings, Tool } from "./useDrawSettings";
import useActionSettings, { Mode, MODES } from "./useActionSettings";
import useFilterSettings, { FilterSettings } from "./useFilterSettings";
import useScaleSettings, { ScaleSettings } from "./useScaleSettings";
import { useElementSize } from "@gadeoli/rjs-hooks-library";
import uuid from "../../../helpers/uuid";
import { getBestBrushSizePt } from "../../../helpers/editor";
import { useElementResizeObserver } from "./useElementResizeObserver";
import useWindowScrollLock from "./useWindowScrollLock";
import { debounce } from "../../../helpers";

const useEditorEngine = (
    initialState : EditorState,
    configs?: EditorConfig 
) => {
    //refs
    const containerRef = useRef<HTMLDivElement | null>(null);
    const containerSize = useElementSize(containerRef);
    const engineRef = useRef<EditorEngine | null>(null);
    const canvasInsideRef = useRef<boolean>(false); //keep info if pointer is inside canvas
    const editorStateRef = useRef<EditorState>({
        backgroundImage: null,
        objects: [],
        selectedObjectIds: []
    });

    if(engineRef.current === null){
        engineRef.current = createEditorEngine(initialState)
    }

    //hooks
    const currentPath = useCurrentPath();
    const { canvasRefs, contexts } = useCanvasLayerRefs(containerRef);
    const contextsRef = useRef(contexts) //use this inside debounce dispatch commands
    const { enableScrollLock, disableScrollLock } = useWindowScrollLock();

    //state
    const [, forceUpdate] = useState(0);
    const actionSettings = useActionSettings();
    const mode = actionSettings.ref.current.mode;
    const {isDrawing, isInside} = actionSettings.ref.current;
    const drawSettings = useDrawSettings();
    const filterSettings = useFilterSettings();
    const scaleSettings = useScaleSettings();
    //state - end

    const dispatch = useCallback((command: Command) => {
        engineRef.current!.dispatch(command);
        editorStateRef.current = engineRef.current!.getState();
        forceUpdate((v) => v + 1);
    }, []);

    const render = useCallback(() => {
        renderEditorState(editorStateRef.current, contexts); 
    }, [contexts]);

    const forceRender = useCallback(() => {
        editorStateRef.current = engineRef.current!.getState();
        render();
        forceUpdate((v) => v + 1);
    }, [render]);

    const undo = useCallback(() => {
        engineRef.current!.undo();
        forceRender();
    }, [forceRender]);

    const redo = useCallback(() => {
        engineRef.current!.redo();
        forceRender();
    }, [forceRender]);

    const reset = useCallback(() => {
        engineRef.current!.reset();
        forceRender();
    }, [forceRender]);

    const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {        
        const canvasRef = canvasRefs.interactions;
        const ctx = contexts.interactions;

        if(canvasRef && ctx){
            if(mode === MODES.DRAW){
                const mousePos = getMousePos(event, canvasRef);
                const tool = drawSettings.ref.current.tool;
                const isErase = DRAW_TOOLS.ERASER === tool;

                currentPath.push(mousePos);

                actionSettings.update({isDrawing: true});
                drawSettings.update({erase: isErase ? true : false});

                //only pen has the first point in the canvas
                if([DRAW_TOOLS.PEN, DRAW_TOOLS.ERASER].includes(tool)){
                    drawStroke(ctx, {
                        points: currentPath.paths.current, 
                        ...drawSettings.ref.current,
                        erase: isErase,
                    });
                }
            }
        }
    }, [mode, drawSettings, contexts]);

    const handlePointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {        
        const canvasRef = canvasRefs.interactions;
        const ctx = contexts.interactions;

        if(canvasRef && ctx){
            if(mode === MODES.DRAW && isDrawing && isInside){
                const mousePos = getMousePos(event, canvasRef);
                const tool = drawSettings.ref.current.tool;
                const stgs = {
                    points: currentPath.paths.current,
                    ...drawSettings.ref.current
                };

                if([DRAW_TOOLS.PEN, DRAW_TOOLS.ERASER].includes(tool)){
                    currentPath.push(mousePos);
                    drawStroke(ctx, {...stgs, erase: DRAW_TOOLS.ERASER === tool});
                }else if([
                    DRAW_TOOLS.LINE, 
                    DRAW_TOOLS.ARROW, 
                    DRAW_TOOLS.CIRCLE
                ].includes(tool)){
                    if(currentPath.paths.current.length > 0){
                        currentPath.set([
                            currentPath.paths.current[0],
                            mousePos
                        ])
                    }else{
                        currentPath.push(mousePos);
                    }

                    //If you don't clear the ctx is possible to create a multi-drawTool effect
                    //very interesting for a future tool
                    clearLayer(ctx);

                    if(tool === DRAW_TOOLS.LINE){
                        drawLine(ctx, stgs)
                    }else if(tool === DRAW_TOOLS.ARROW){
                        drawArrow(ctx, stgs)
                    }else if(tool === DRAW_TOOLS.CIRCLE){
                        drawCircle(ctx, stgs)
                    }
                }
            }
        }
    }, [mode, drawSettings, isDrawing]);

    const handlePointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {        
            const canvasRef = canvasRefs.interactions;
            const ctx = contexts.interactions;

            if(canvasRef && ctx){
                if(mode === MODES.DRAW && isDrawing){
                    const mousePos = getMousePos(event, canvasRef);
                    currentPath.push(mousePos);

                    dispatch(addDrawingCommand({
                        id: uuid(),
                        type: 'drawing',
                        points: currentPath.paths.current,
                        ...drawSettings.ref.current
                    }));

                    currentPath.reset();

                    clearLayer(ctx);

                    actionSettings.update({isDrawing: false});
                }
            }
    }, [mode, isDrawing]);

    const handlePointerOut = (event: React.PointerEvent<HTMLCanvasElement>) => {        
        actionSettings.update({isInside: false});
        canvasInsideRef.current = false;
        disableScrollLock();
    }

    const handlePointerEnter = (event: React.PointerEvent<HTMLCanvasElement>) => {        
        actionSettings.update({isInside: true});
        canvasInsideRef.current = true;
        enableScrollLock();
    }

    const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {  
        debouncedWheel(event.deltaY);
    };

    /**
     * Generates a image source from the canvas content.
     * @returns {Promise<string | null>} A promise that resolves with the edited image src or null if the canvas is not available.
     */
    const generateEditedImage = (): Promise<string | null> => {
        if(
            !canvasRefs.background.current || 
            !canvasRefs.drawings.current || 
            !canvasRefs.texts.current
        ){
            return new Promise((resolve) => {
                resolve(null);
                return;
            })
        };

        const bgCanvas = canvasRefs.background.current;
        const layersCanvas = [
            bgCanvas,
            canvasRefs.drawings.current,
            canvasRefs.texts.current
        ]; 

        return generateCanvasImage(
            layersCanvas,
            {
                height: bgCanvas.height,
                width: bgCanvas.width
            }
        );
    };

    //UI Setters
    const setMode = (mode: Mode) => actionSettings.update({mode: mode}); 
    const setDrawTool = (tool: Tool) => drawSettings.update({tool: tool});
    const setEditedImage = (src : string) => {
        const image = new Image();
        image.src = src;
        image.onload = () => {
            const prevImage = engineRef.current!.getState().backgroundImage;
            const biggerSize = getBiggerSize(image);
            const fixCssWidth = configs?.fixCssWidth || 1;

            setCanvasSizeFromImage(canvasRefs, image, containerSize, fixCssWidth);
            drawSettings.update({
                brushSize: getBestBrushSizePt(biggerSize)
            });
            
            dispatch(setBackgroundImageCommand(image, prevImage));

            render();
        }
    };
    const setFilters = (values: Partial<FilterSettings>) => {
        filterSettings.update(values)

        debounced500Action(
            () => {
                dispatch(
                    updateFiltersCommand({
                        id: uuid(),
                        type: 'filter',
                        values: filterSettings.ref.current
                    })
                )

                forceRender()                
            }
        )
    };
    const setScales = (values: Partial<ScaleSettings>) => {
        scaleSettings.update(values)

        debounced500Action(
            () => {
                dispatch(
                    updateScalesCommand({
                        id: uuid(),
                        type: 'scale',
                        values: scaleSettings.ref.current
                    })
                )

                forceRender()                
            }
        )
    }

    //rerender image on resize
    useElementResizeObserver(containerRef, contexts, (size) => {
        const image = engineRef.current!.getState().backgroundImage;

        if(image){
            const biggerSize = getBiggerSize(image);
            const fixCssWidth = configs?.fixCssWidth || 1;

            setCanvasSizeFromImage(canvasRefs, image, containerSize, fixCssWidth);
            
            drawSettings.update({
                brushSize: getBestBrushSizePt(biggerSize)
            });

            render();
        }  
    })

    const debouncedWheel = useRef(
        debounce((deltaY: number) => {
            if(!canvasInsideRef.current || mode !== MODES.PAN) return;

            let newZoom = (Number)(scaleSettings.ref.current.zoom.toFixed(2));

            if (deltaY < 0) {
                newZoom += 0.1;
            }else{
                newZoom -= 0.1;
            }

            scaleSettings.update({zoom: newZoom})
        }, 200)
    ).current;

    const debounced500Action = useRef(
        debounce((action: any) => {
            action();
        }, 500)
    ).current;

    //avoid useEffect when possible
    useEffect(() => {
        contextsRef.current = contexts;
    }, [contexts]);

    return {
        containerRef,
        canvasRefs,
        contexts,
        mode: actionSettings.ui.mode,
        pointer: actionSettings.ui.pointer,
        drawTool: drawSettings.ui.tool,
        drawPallete: drawSettings.ui,
        canUndo: engineRef.current!.canUndo(),
        canRedo: engineRef.current!.canRedo(),
        canReset: engineRef.current!.canReset(),
        filters: filterSettings.ui,
        scales: scaleSettings.ui,

        setMode,
        setDrawTool,
        setDrawPallete: (stg : Partial<DrawSettings>) => drawSettings.update(stg),
        setFilters: (values : Partial<FilterSettings>) => setFilters(values),
        setScales: (values : Partial<ScaleSettings>) => setScales(values),
        dispatch,
        undo,
        redo,
        reset,
        render,
        getState: () => engineRef.current!.getState(),
        generateEditedImage,
        setEditedImage,
        
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerOut,
        handlePointerEnter,
        handleWheel
    };
};

export default useEditorEngine;