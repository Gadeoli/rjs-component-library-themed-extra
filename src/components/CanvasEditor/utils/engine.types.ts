import { Command, EditorState } from "../hooks/useEditorEngine.types";

export type EditorEngine = {
    getState: () => EditorState;
    dispatch: (command: Command) => void;
    undo: () => void;
    redo: () => void;
    
    // canUndo: () => boolean;
    // canRedo: () => boolean;
    // clearHistory: () => void;
    // getHistory: () => {
    //     undoStack: Command[];
    //     redoStack: Command[];
    // };
}