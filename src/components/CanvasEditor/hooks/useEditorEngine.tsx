import { 
    useCallback,
    useRef, 
    useState
} from "react";
import { 
    Command,
    EditorState, 
    MODES
} from "./useEditorEngine.types";
import { 
    renderEditorState 
} from "../utils/helpers";
import { useCanvasLayerRefs } from "./useCanvasLayerRefs";
import createEditorEngine from "../utils/engine";
import { EditorEngine } from "../utils/engine.types";

const useEditorEngine = (initialState : EditorState) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { canvasRefs, contexts } = useCanvasLayerRefs(containerRef);
    const engineRef = useRef<EditorEngine | null>(null);

    const editorStateRef = useRef<EditorState>({
        backgroundImage: null,
        objects: [],
        selectedObjectIds: []
    });

    //state
    const [, forceUpdate] = useState(0);
    const [mode, setMode] = useState<MODES>(MODES.DRAW);
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

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {        

    }

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {        
        
    }

    const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {        
        
    }

    const handlePointerOut = (event: React.PointerEvent<HTMLCanvasElement>) => {        
        
    }

    const handlePointerEnter = (event: React.PointerEvent<HTMLCanvasElement>) => {        
        
    }

    return {
        containerRef,
        canvasRefs,
        contexts,
        mode,

        setMode,
        dispatch,
        undo,
        redo,
        render,
        getState: () => editorStateRef.current,
        
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerOut,
        handlePointerEnter
    };
};

export default useEditorEngine;