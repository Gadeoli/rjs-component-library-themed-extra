import { useRef } from "react";
import { Point } from "./useEditorEngine.types";

const useCurrentPath = (initialPaths : Point[] = []) => {
    const currentPath = useRef<Point[]>(initialPaths);
    
    const push = (point : Point) => {
        currentPath.current.push(point);
    }

    const merge = (points : Point[]) => {
        currentPath.current = currentPath.current.concat(points);
    }

    const reset = () => {
        currentPath.current = initialPaths;
    }

    const set = (points: Point[]) => {
        currentPath.current = points;
    }

    return {
        paths: currentPath,
        set,
        push,
        merge,
        reset
    }
}

export default useCurrentPath;