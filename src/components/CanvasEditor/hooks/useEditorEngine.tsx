import { 
    useCallback,
    useRef, 
    useState
} from "react";
import { 
    Command,
    EditorState
} from "./useEditorEngine.types";
import { 
    addDrawingCommand,
    clearLayer,
    drawStroke,
    getMousePos,
    renderEditorState 
} from "../utils/helpers";
import { useCanvasLayerRefs } from "./useCanvasLayerRefs";
import createEditorEngine from "../utils/engine";
import { EditorEngine } from "../utils/engine.types";
import useCurrentPath from "./useCurrentPath";
import uuid from "../../../helpers/uuid";
import useDrawSettings, { Tool } from "./useDrawSettings";
import useActionSettings, { Mode, MODES } from "./useActionSettings";

const useEditorEngine = (initialState : EditorState) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { canvasRefs, contexts } = useCanvasLayerRefs(containerRef);
    const engineRef = useRef<EditorEngine | null>(null);
    const currentPath = useCurrentPath();

    const editorStateRef = useRef<EditorState>({
        backgroundImage: null,
        objects: [],
        selectedObjectIds: []
    });

    //state
    const [, forceUpdate] = useState(0);
    const actionSettings = useActionSettings();
    const mode = actionSettings.ref.current.mode;
    const {isDrawing, isInside} = actionSettings.ref.current;
    const drawSettings = useDrawSettings();
    //state - end

    if(engineRef.current === null){
        engineRef.current = createEditorEngine(initialState)
    }

    const dispatch = useCallback((command: Command) => {
        engineRef.current!.dispatch(command);
        forceUpdate((v) => v + 1);
    }, []);

    const render = () => useCallback(() => {
        renderEditorState(editorStateRef.current, contexts); 
    }, []);

    const undo = useCallback(() => {
        engineRef.current!.undo();
        forceUpdate((v) => v + 1);
    }, []);

    const redo = useCallback(() => {
        engineRef.current!.redo();
        forceUpdate((v) => v + 1);
    }, []);

    const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {        
        const canvasRef = canvasRefs.interactions;
        const ctx = contexts.interactions;

        if(canvasRef && ctx){
            if(mode === MODES.DRAW){
                const mousePos = getMousePos(event, canvasRef);
                
                currentPath.push(mousePos);

                actionSettings.update({...actionSettings, isDrawing: true});
                
                drawStroke(ctx, currentPath.paths.current, drawSettings.ui);
            }
        }
    }, [mode, contexts]);

    const handlePointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {        
        const canvasRef = canvasRefs.interactions;
        const ctx = contexts.interactions;

        if(canvasRef && ctx){
            if(mode === MODES.DRAW && isDrawing && isInside){
                const mousePos = getMousePos(event, canvasRef);
                
                currentPath.push(mousePos);
                
                drawStroke(ctx, currentPath.paths.current, drawSettings.ui);
            }
        }
    }, [mode, isDrawing]);

    const handlePointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {        
            const canvasRef = canvasRefs.interactions;
            const ctx = contexts.interactions;

            if(canvasRef && ctx){
                if(mode === MODES.DRAW && isDrawing){
                    const mousePos = getMousePos(event, canvasRef);
                    
                    currentPath.push(mousePos);

                    dispatch(addDrawingCommand({
                        id: uuid(),
                        type: "drawing",
                        points: currentPath.paths.current,
                        color: drawSettings.ref.current.tool,
                        brushSize: drawSettings.ref.current.size,
                    }));

                    currentPath.reset();

                    clearLayer(ctx);

                    actionSettings.update({...actionSettings, isDrawing: false});
                }
            }
    }, [mode, isDrawing]);

    const handlePointerOut = (event: React.PointerEvent<HTMLCanvasElement>) => {        
        actionSettings.update({...actionSettings, isInside: false});
    }

    const handlePointerEnter = (event: React.PointerEvent<HTMLCanvasElement>) => {        
        actionSettings.update({...actionSettings, isInside: true});
    }

    //UI Setters
    const setMode = (mode: Mode) => actionSettings.update({...actionSettings.action, mode: mode}); 
    const setDrawTool = (tool: Tool) => drawSettings.update({...drawSettings.ui, tool: tool});

    return {
        containerRef,
        canvasRefs,
        contexts,
        mode: actionSettings.action.mode,
        drawTool: drawSettings.ui.tool,
        pointer: actionSettings.action.pointer,

        setMode,
        setDrawTool,
        dispatch,
        undo,
        redo,
        render,
        getState: () => engineRef.current!.getState(),
        
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerOut,
        handlePointerEnter
    };
};

export default useEditorEngine;