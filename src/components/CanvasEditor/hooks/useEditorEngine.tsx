import { 
    useCallback,
    useEffect,
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
    setCanvasSizeFromImage
} from "../utils/helpers";
import { useCanvasLayerRefs } from "./useCanvasLayerRefs";
import createEditorEngine from "../utils/engine";
import { EditorEngine } from "../utils/engine.types";
import useCurrentPath from "./useCurrentPath";
import useDrawSettings, { DRAW_TOOLS, DrawSettings, Tool } from "./useDrawSettings";
import useActionSettings, { Mode, MODES } from "./useActionSettings";
import useFilterSettings from "./useFilterSettings";
import useScaleSettings from "./useScaleSettings";
import { useElementSize } from "@gadeoli/rjs-hooks-library";
import uuid from "../../../helpers/uuid";
import { getBestBrushSizePt } from "../../../helpers/editor";
import { useElementResizeObserver } from "./useElementResizeObserver";

const useEditorEngine = (
    initialState : EditorState,
    configs?: EditorConfig 
) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const containerSize = useElementSize(containerRef);
    const { canvasRefs, contexts } = useCanvasLayerRefs(containerRef);
    const engineRef = useRef<EditorEngine | null>(null);
    const currentPath = useCurrentPath();

    const editorStateRef = useRef<EditorState>({
        backgroundImage: null,
        objects: [],
        selectedObjectIds: []
    });

    //state
    const [update, forceUpdate] = useState(0);
    const actionSettings = useActionSettings();
    const mode = actionSettings.ref.current.mode;
    const {isDrawing, isInside} = actionSettings.ref.current;
    const drawSettings = useDrawSettings();
    const filterSettings = useFilterSettings();
    const scaleSettings = useScaleSettings();
    //state - end

    if(engineRef.current === null){
        engineRef.current = createEditorEngine(initialState)
    }

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
    }

    const handlePointerEnter = (event: React.PointerEvent<HTMLCanvasElement>) => {        
        actionSettings.update({isInside: true});
    }

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

        setMode,
        setDrawTool,
        setDrawPallete: (stg : Partial<DrawSettings>) => drawSettings.update(stg),
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
        handlePointerEnter
    };
};

export default useEditorEngine;