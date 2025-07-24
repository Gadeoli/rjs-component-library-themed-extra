import { Command, EditorState } from "../hooks/useEditorEngine.types";
import { EditorEngine } from "./engine.types";

const createEditorEngine = (initialState: EditorState): EditorEngine => {
    let current = initialState;

    const undoStack: Command[] = [];
    const redoStack: Command[] = [];

    return {
        canUndo: () => undoStack.length > 0,
        canRedo: () => redoStack.length > 0,
        canReset: () => current.objects.length > 0,
        
        getState: () => current,

        dispatch: (cmd: Command) => {
            undoStack.push(cmd);
            redoStack.length = 0; // clear redo on new action
            current = cmd.apply(current);
        },

        undo: () => {
            if (undoStack.length === 0) return;
            
            const last = undoStack.pop()!;
            
            redoStack.push(last);
            
            current = undoStack.reduce((state, cmd) => cmd.apply(state), initialState);
        },

        redo: () => {
            if (redoStack.length === 0) return;
            
            const cmd = redoStack.pop()!;
            
            undoStack.push(cmd);
            
            current = cmd.apply(current);
        },

        reset: () => {
            undoStack.length = 0;
            redoStack.length = 0;
            current = initialState;
        }
    }; 
}

export default createEditorEngine;