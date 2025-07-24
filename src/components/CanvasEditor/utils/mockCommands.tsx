import uuid from "../../../helpers/uuid";
import { DRAW_TOOLS } from "../hooks/useDrawSettings";
import { DrawingObject } from "../hooks/useEditorEngine.types";

export const strokes : DrawingObject[] = [
    {
        id: uuid(),
        type: "drawing",
        tool: DRAW_TOOLS.PEN,
        points: [
            { x: 50, y: 50 },
            { x: 100, y: 100 },
            { x: 150, y: 50 },
        ],
        color: "black",
        brushSize: 3,
        erase: false
    }
];