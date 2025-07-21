import uuid from "../../../helpers/uuid";
import { DrawingObject } from "../hooks/useEditorEngine.types";

export const strokes : DrawingObject[] = [
    {
        id: uuid(),
        type: "drawing",
        points: [
            { x: 50, y: 50 },
            { x: 100, y: 100 },
            { x: 150, y: 50 },
        ],
        color: "black",
        brushSize: 3,
    }
];