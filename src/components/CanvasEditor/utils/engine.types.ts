import { Command, EditorState } from "../hooks/useEditorEngine.types";

export type EditorEngine = {    
    getState: () => EditorState;
    dispatch: (command: Command) => void;
    undo: () => void;
    redo: () => void;
    reset: () => void;
    
    canUndo: () => boolean;
    canRedo: () => boolean;
    canReset: () => boolean,
    // getHistory: () => {
    //     undoStack: Command[];
    //     redoStack: Command[];
    // };
}