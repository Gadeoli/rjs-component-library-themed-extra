import { useEffect, useRef, useState } from "react";
import { 
    DefaultProps,

    ModesType,
    DrawToolsType,
    
    DrawingItemProps,
    PointProps,
    UndoRedoItemProps,
    PansItemProps,
    TextItemProps
} from "./usePhotoEditor.types";
import { drawArrowHead, extractFiltersFromState, generateCanvasImage, getMetrics, getMousePos, initialCords, isInsideWrite } from "./helpers";

const usePhotoEditor = ({
    src,
    scales = {
        brightness: 100,
        contrast: 100,
        saturate: 100,
        grayscale: 0,
    },
    positions = {
        flipHorizontal: false,
        flipVertical: false,
        zoom: 1,
        rotate: 0,
    },
    actions = {
        mode: 'draw',
        drawSettings: {
            tool: 'pen',
            color: "#000000",
            size: 10
        },
        writeSettings: {
            text: '',
            font: 'Arial',
            fontSize: 20,
            color: '#000000',
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1
        }
    },
    labels = {
        writeInitial: 'New Text...'
    }
}: DefaultProps) => {
    const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const imgRef = useRef(new Image());

    const isRestoringFiltersRef = useRef<boolean | null>(false); useRef(false);
    const getFiltersEditorState = () => extractFiltersFromState({
        ...positions,
        ...scales,
        editorOffset: editorOffset
    })

    //state
    //general
    const [imageSrc, setImageSrc] = useState<string>('');
    const [action, setAction] = useState<ModesType>(actions.mode);
    const [undoStack, setUndoStack] = useState<UndoRedoItemProps[]>([]);
    const [canUndo, setCanUndo] = useState(false);
    const [redoStack, setRedoStack] = useState<UndoRedoItemProps[]>([]);
    const [canRedo, setCanRedo] = useState(false);
    const [editorOffset, setEditorOffset] = useState<PointProps>(initialCords);
    const [cursor, setCursor] = useState<string>('default');
    //filters
    const [filters, setFilters] = useState<string[]>([]);
    const [brightness, setBrightness] = useState(scales.brightness);
    const [contrast, setContrast] = useState(scales.contrast);
    const [saturate, setSaturate] = useState(scales.saturate);
    const [grayscale, setGrayscale] = useState(scales.grayscale);
    const [flipHorizontal, setFlipHorizontal] = useState(positions.flipHorizontal);
    const [flipVertical, setFlipVertical] = useState(positions.flipVertical);
    const [zoom, setZoom] = useState(positions.zoom);
    const [rotate, setRotate] = useState(positions.rotate);
    const filtersSnapShot = JSON.stringify(getFiltersEditorState());
    //## handling draw & panning & writting
    //general
    const [currentPath, setCurrentPath] = useState<PointProps[]>([]);
    //drawing
    const [drawings, setDrawings] = useState<DrawingItemProps[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawTool, setDrawTool] = useState<DrawToolsType>(actions.drawSettings.tool);
    const [drawColor, setDrawColor] = useState(actions.drawSettings.color);
    const [brushSize, setBrushSize] = useState(actions.drawSettings.size);
    //drag
    const [pans, setPans] = useState<PansItemProps[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<PointProps>(initialCords);
    // write
    const [texts, setTexts] = useState<TextItemProps[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [writeEditorPos, setWriteEditorPos] = useState<PointProps>(initialCords);
    const [writeText, setWriteText] = useState(actions.writeSettings.text);
    const [writeFontFamily, setWriteFontFamily] = useState<string>(actions.writeSettings.font);
    const [writeFontSize, setWriteFontSize] = useState<number>(actions.writeSettings.fontSize);
    const [writeFont, setWriteFont] = useState<string>(`${actions.writeSettings.fontSize}px ${actions.writeSettings.font}`);
    const [writeColor, setWriteColor] = useState(actions.writeSettings.color);
    const [writeRotation, setWriteRotation] = useState(actions.writeSettings.rotation);
    const [writeScale, setWriteScale] = useState(actions.writeSettings.scale);
    //State - end    

    // Effect to update the image source when the src changes.
    useEffect(() => {
        setImageSrc(src ? src : '');
        resetFilters();
    }, [src]);

    // Effect to apply transformations and filters whenever relevant state changes.
    useEffect(() => {
        applyFilters();
    }, [
        src,
        imageSrc,
        rotate,
        flipHorizontal,
        flipVertical,
        zoom,
        brightness,
        contrast,
        saturate,
        grayscale,
        editorOffset.x,
        editorOffset.y,

        pans,
    ]);

    // Effect to apply draws whenever relevant state changes.
    useEffect(() => {
        applyDraws();
    }, [
        src,
        imageSrc,

        texts,
        drawings,
        
        currentPath,
        selectedIndex,
        
        brushSize,
        drawColor,
        drawTool,
        isDrawing,
        
        editorOffset.x,
        editorOffset.y,
        dragOffset.x,
        dragOffset.y,
    ]);

    useEffect(() => {
        if (isRestoringFiltersRef.current) return;

        const timeout = setTimeout(() => {
            //setFilters([...filters, filtersSnapShot]);
            //pushUndo();
        }, 200); // Adjust debounce delay as needed

        return () => clearTimeout(timeout);
    }, [filtersSnapShot]);

    useEffect(() => {
        const newFont = `${actions.writeSettings.fontSize}px ${actions.writeSettings.font}`;
        setWriteFont(newFont);
    }, [writeFont, writeFontSize]);

    useEffect(() => {
        setCanRedo(redoStack.length === 0);
    }, [redoStack.length]);

    useEffect(() => {
        setCanUndo(undoStack.length === 0);
    }, [undoStack.length]);

    useEffect(() => {
        let c = '';

        if(action === 'draw'){
            c =  'crosshair';
        }else if(action === 'pan'){
            c = 'grab';
        }else{
            c = 'default';
        }

        setCursor(c);
    }, [action]);

    const restoreFiltersEditorState = (state:any) => {
        isRestoringFiltersRef.current = true;

        try {
            const stackedFilterState = JSON.parse(state);

            setBrightness(stackedFilterState.brightness);
            setContrast(stackedFilterState.contrast);
            setGrayscale(stackedFilterState.grayscale);
            setSaturate(stackedFilterState.saturate);
            setRotate(stackedFilterState.rotate);
            setFlipHorizontal(stackedFilterState.flipHorizontal);
            setFlipVertical(stackedFilterState.flipVertical);
            setZoom(stackedFilterState.zoom);
            setEditorOffset(stackedFilterState.offset);
        } catch (error) {
            console.log({
                error,
                state
            });
        }

        requestAnimationFrame(() => {
            isRestoringFiltersRef.current = false;
        });
    };

    /**
     * Applies the selected filters and transformations to image canvas.
     * And Set size and offset for both canvas
     */
    const applyFilters = () => {
        if (!imageSrc) return;

        const imageCanvas = imageCanvasRef.current;
        const imageCtx = imageCanvas?.getContext('2d');

        const editorCanvas = editorCanvasRef.current;
        const editorCtx = editorCanvas?.getContext('2d');

        const imgElement = imgRef.current;
        imgRef.current.src = imageSrc;
        imgRef.current.onload = applyFilters;

        imgElement.onload = () => {
            if (imageCanvas && imageCtx && editorCanvas && editorCtx) {
                const zoomedWidth = imgElement.width * zoom;
                const zoomedHeight = imgElement.height * zoom;
                const translateX = (imgElement.width - zoomedWidth) / 2;
                const translateY = (imgElement.height - zoomedHeight) / 2;

                // Set canvas dimensions to match the image.
                imageCanvas.width = imgElement.width;
                imageCanvas.height = imgElement.height;
                //Set the editor canvas dimensions to match the image
                editorCanvas.width = imgElement.width;
                editorCanvas.height = imgElement.height;

                // Clear the canvas before drawing the updated image.
                imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

                // Apply filters and transformations.
                imageCtx.filter = getFilterString();
                imageCtx.save();

                if (rotate) {
                    const centerX = imageCanvas.width / 2;
                    const centerY = imageCanvas.height / 2;
                    const angle = (rotate * Math.PI) / 180;

                    imageCtx.translate(centerX, centerY);
                    imageCtx.rotate(angle);
                    imageCtx.translate(-centerX, -centerY);

                    editorCtx.translate(centerX, centerY);
                    editorCtx.rotate(angle);
                    editorCtx.translate(-centerX, -centerY);
                }

                if (flipHorizontal) {
                    imageCtx.translate(imageCanvas.width, 0);
                    imageCtx.scale(-1, 1);

                    editorCtx.translate(imageCanvas.width, 0);
                    editorCtx.scale(-1, 1);
                }

                if (flipVertical) {
                    imageCtx.translate(0, imageCanvas.height);
                    imageCtx.scale(1, -1);

                    editorCtx.translate(0, imageCanvas.height);
                    editorCtx.scale(1, -1);
                }

                imageCtx.translate(translateX + editorOffset.x, translateY + editorOffset.y);
                imageCtx.scale(zoom, zoom);
                imageCtx.drawImage(imgElement, 0, 0, imageCanvas.width, imageCanvas.height);
                imageCtx.restore();
                imageCtx.filter = 'none';

                editorCtx.translate(translateX + editorOffset.x, translateY + editorOffset.y);
                editorCtx.scale(zoom, zoom);
                imageCtx.restore();
                imageCtx.filter = 'none';
                
                // Old Code - This is needed now ??call applyDraws is equal??
                // redrawDrawingPaths(editorCtx);
                applyDraws();
            }
        };
    };

    const applyDraws = () => {
        const editorCanvas = editorCanvasRef.current;
        const editorCtx = editorCanvas?.getContext('2d');

        if(!editorCanvas || !editorCtx) return;

        editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

        // Render drawings
        drawings.forEach((drawing) => {
            editorCtx.save();
            editorCtx.lineCap = 'round';
            editorCtx.lineJoin = 'round';
            editorCtx.lineWidth = drawing.width;
            
            if (drawing.erase) {
                editorCtx.globalCompositeOperation = 'destination-out';
                editorCtx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                editorCtx.globalCompositeOperation = 'source-over';
                editorCtx.strokeStyle = drawing.color || 'black';
            }

            if (drawing.tool === 'line') {
                const [p0, p1] = drawing.points;
                
                editorCtx.beginPath();
                editorCtx.moveTo(p0.x, p0.y);
                editorCtx.lineTo(p1.x, p1.y);
                editorCtx.stroke();
            } else if (drawing.tool === 'circle') {
                const [center, edge] = drawing.points;
                const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
                
                editorCtx.beginPath();
                editorCtx.arc(center.x, center.y, radius, 0, Math.PI * 2);
                editorCtx.stroke();
            } else if (drawing.tool === 'arrow') {
                const [p0, p1] = drawing.points;

                const headSize = 8 + drawing.width * 1.5;

                // Calculate unit direction vector from p0 to p1
                const dx = p1.x - p0.x;
                const dy = p1.y - p0.y;
                const length = Math.hypot(dx, dy);

                const unitX = dx / length;
                const unitY = dy / length;

                // Trimmed end of the shaft (p1 shifted back by headSize)
                const shaftEnd = {
                x: p1.x - unitX * headSize,
                y: p1.y - unitY * headSize,
                };

                // Draw the shaft
                editorCtx.beginPath();
                editorCtx.moveTo(p0.x, p0.y);
                editorCtx.lineTo(shaftEnd.x, shaftEnd.y);
                editorCtx.stroke();

                // Compute arrowhead based on shaftEnd → p1 direction
                const [left, right, tip] = drawArrowHead(shaftEnd, p1, headSize, drawing.width);

                // Draw the arrowhead
                editorCtx.beginPath();
                editorCtx.moveTo(tip.x, tip.y);
                editorCtx.lineTo(left.x, left.y);
                editorCtx.lineTo(right.x, right.y);
                editorCtx.closePath();
                editorCtx.fillStyle = drawing.color || 'black';
                editorCtx.fill();
            } else {
                // pen / eraser path
                if (drawing.points.length < 2) return;
                
                editorCtx.beginPath();
                editorCtx.moveTo(drawing.points[0].x, drawing.points[0].y);
                
                drawing.points.forEach((pt) => editorCtx.lineTo(pt.x, pt.y));
                
                editorCtx.stroke();
            }

            editorCtx.restore();
        });

        // Preview current in-progress drawing
        if (isDrawing && currentPath.length) {
            editorCtx.save();
            editorCtx.lineCap = 'round';
            editorCtx.lineJoin = 'round';
            editorCtx.lineWidth = brushSize;

            if (drawTool === 'eraser') {
                editorCtx.globalCompositeOperation = 'destination-out';
                editorCtx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                editorCtx.globalCompositeOperation = 'source-over';
                editorCtx.strokeStyle = drawColor;
            }

            if (drawTool === 'line' && currentPath.length === 2) {
                const [p0, p1] = currentPath;

                editorCtx.beginPath();
                editorCtx.moveTo(p0.x, p0.y);
                editorCtx.lineTo(p1.x, p1.y);
                editorCtx.stroke();
            } else if (drawTool === 'circle' && currentPath.length === 2) {
                const [center, edge] = currentPath;
                const radius = Math.hypot(edge.x - center.x, edge.y - center.y);

                editorCtx.beginPath();
                editorCtx.arc(center.x, center.y, radius, 0, Math.PI * 2);
                editorCtx.stroke();
            } else if (drawTool === 'arrow' && currentPath.length === 2) {
                const [p0, p1] = currentPath;

                editorCtx.beginPath();
                editorCtx.moveTo(p0.x, p0.y);
                editorCtx.lineTo(p1.x, p1.y);
                editorCtx.stroke();

                const headSize = 8 + brushSize * 1.5;
                const [left, right] = drawArrowHead(p0, p1, headSize);

                editorCtx.beginPath();
                editorCtx.moveTo(p1.x, p1.y);
                editorCtx.lineTo(left.x, left.y);
                editorCtx.lineTo(right.x, right.y);
                editorCtx.closePath();
                editorCtx.fillStyle = drawColor;
                editorCtx.fill();
            } else if (drawTool === 'pen') {
                editorCtx.beginPath();
                editorCtx.moveTo(currentPath[0].x, currentPath[0].y);
                currentPath.forEach((pt) => editorCtx.lineTo(pt.x, pt.y));
                editorCtx.stroke();
            }

            editorCtx.restore();
        }

        // Render texts
        texts.forEach((t, i) => {
            const { lines, width, height, lineHeight } = getMetrics(t, editorCtx);

            editorCtx.save();
            editorCtx.translate(t.x, t.y);
            editorCtx.rotate((t.rotation * Math.PI) / 180);
            editorCtx.scale(t.scale, t.scale);
            editorCtx.font = t.font;
            editorCtx.fillStyle = t.color;
            lines.forEach((ln, idx) => editorCtx.fillText(ln, 0, idx * lineHeight));

            if (i === selectedIndex) {
                editorCtx.strokeStyle = 'red';
                editorCtx.strokeRect(0, 0, width, height);
            }

            editorCtx.restore();

        }); 
    };

    /**
     * Generates a image source from the canvas content.
     * @returns {Promise<string | null>} A promise that resolves with the edited image src or null if the canvas is not available.
     */
    const generateEditedImage = (): Promise<string | null> => {
        const imageCanvas = imageCanvasRef.current;
        const editorCanvas = editorCanvasRef.current;

        if(!imageCanvas || !editorCanvas){
            return new Promise((resolve) => {
                resolve(null);
                return;
            })
        };

        const layersCanvas = [
            imageCanvas, //let in first position
            editorCanvas
        ];

        return generateCanvasImage(
            layersCanvas,
            {
                height: imageCanvas.height,
                width: imageCanvas.width
            }
        );
    };

    /**
     * Generates a string representing the current filter settings.
     *
     * @returns {string} - A CSS filter string.
     */
    const getFilterString = (): string => {
        return `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) saturate(${saturate}%)`;
    };

    // IMAGE HANDLES
    /**
     * Handles the zoom-in action.
     */
    const handleZoomIn = () => {
        setZoom((prevZoom) => prevZoom + 0.1);
    };

    /**
     * Handles the zoom-out action.
     */
    const handleZoomOut = () => {
        setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.1));
    };

    // EDITOR HANDLES
    const pushUndo = () => {
        setUndoStack((prev) => [
            ...prev,
            {
                filters: JSON.parse(JSON.stringify(filters)),
                texts: JSON.parse(JSON.stringify(texts)),
                drawings: JSON.parse(JSON.stringify(drawings)),
                pans: JSON.parse(JSON.stringify(pans)),
            },
        ]);
        setRedoStack([]); // clear redo on new action
    };

    const handlePansChange = ({handledPans, type} : {handledPans: any[], type: 'undo' | 'redo'}) => {     
        if(handledPans.length){
            const ps = handledPans[handledPans.length - 1]?.points;

            if (ps && ps.length >= 2) {
                const deltaX = ps[ps.length - 1].x - ps[1].x;
                const deltaY = ps[ps.length - 1].y - ps[1].y;                

                if(type === 'undo'){
                    setEditorOffset({
                        x: editorOffset.x - deltaX,
                        y: editorOffset.y - deltaY
                    });
                }else{
                    setEditorOffset({
                        x: editorOffset.x + deltaX,
                        y: editorOffset.y + deltaY
                    });
                }                
            }
        }
    }
 
    const handleUndo = () => {
        if (!undoStack.length) return;

        const prev = undoStack[undoStack.length - 1];

        setUndoStack((stack) => stack.slice(0, -1));
        
        setRedoStack((redo) => [
            ...redo,
            {
                filters: JSON.parse(JSON.stringify(filters)),
                texts: JSON.parse(JSON.stringify(texts)),
                drawings: JSON.parse(JSON.stringify(drawings)),
                pans: JSON.parse(JSON.stringify(pans)),
            },
        ]);

        handlePansChange({handledPans: pans, type: 'undo'});

        if(prev.filters.length){
            restoreFiltersEditorState(prev.filters[prev.filters.length - 1]);
        }

        setTexts(prev.texts);
        setDrawings(prev.drawings);
        setPans(prev.pans);
        setFilters(prev.filters),
        setSelectedIndex(null);
    };

    const handleRedo = () => {
        if (!redoStack.length) return;

        const next = redoStack[redoStack.length - 1];

        setRedoStack((stack) => stack.slice(0, -1));
        setUndoStack((undo) => [
            ...undo,
            {
                filters: JSON.parse(JSON.stringify(filters)),
                texts: JSON.parse(JSON.stringify(texts)),
                drawings: JSON.parse(JSON.stringify(drawings)),
                pans: JSON.parse(JSON.stringify(pans)),
            },
        ]);

        handlePansChange({handledPans: next.pans, type: 'redo'});

        if(next.filters.length){
            restoreFiltersEditorState(next.filters[next.filters.length - 1]);
        }

        setTexts(next.texts);
        setDrawings(next.drawings);
        setPans(next.pans);
        setFilters(next.filters)
        setSelectedIndex(null);
    };

    /**
     * Handles the canvas image click and handle tools in canvas editor.
     */
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const editorCanvas = editorCanvasRef.current;
        const editorCtx = editorCanvas?.getContext('2d');

        if(!editorCanvas || !editorCtx || action !== 'write') return; 
        
        const pos = getMousePos(e, editorCanvasRef);
        const idx = texts.findIndex((t) => isInsideWrite(pos, t, editorCtx));

        if (idx !== -1) {
            const t = texts[idx];
            
            setSelectedIndex(idx);
            setWriteText(t.text);
            setWriteFont(t.font);
            setWriteColor(t.color);
            setWriteRotation(t.rotation);
            setWriteScale(t.scale);
            setWriteEditorPos(pos);
        } else {
            setSelectedIndex(null);
        }
    };

    /**
     * Handles the canvas image double click and handle tools in canvas editor.
     */
    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const editorCanvas = editorCanvasRef.current;
        const editorCtx = editorCanvas?.getContext('2d');

        if(!editorCanvas || !editorCtx || action !== 'write') return; 

        pushUndo();

        const pos = getMousePos(e, editorCanvasRef);
        const newText: TextItemProps = {
          text: labels.writeInitial,
          x: pos.x,
          y: pos.y,
          font: writeFont,
          fontSize: writeFontSize,
          color: writeColor,
          rotation: 0,
          scale: 1,
        };
        
        setTexts((prev) => [...prev, newText]);
        setWriteText(labels.writeInitial);
        setWriteRotation(0);
        setWriteScale(1);
        setWriteEditorPos({ x: pos.x + 10, y: pos.y + 10 });
        setSelectedIndex(texts.length);
    };

    const updateText = () => {
        if(selectedIndex === null) return;

        pushUndo();

        setTexts((prev) => {
            const updated = [...prev];

            updated[selectedIndex] = {
                ...updated[selectedIndex],
                text: writeText,
                font: writeFont,
                color: writeColor,
                rotation: writeRotation,
                scale: writeScale,
            };
        
            return updated;
        });
    }

    //Both Handles
    /**
     * Handles the pointer down event for initiating drawing or drag-and-drop panning.
     */
    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const editorCanvas = editorCanvasRef.current;
        const editorCtx = editorCanvas?.getContext('2d');

        if(!editorCanvas || !editorCtx) return; 

        const pos = getMousePos(event, editorCanvasRef);

        if (action === 'draw') {
            pushUndo();
            setIsDrawing(true);

            if (drawTool === 'line' || drawTool === 'arrow' || drawTool === 'circle') {
                setCurrentPath([pos]); // start point
            } else {
                setCurrentPath([pos]);
            }
        }else if (action === 'pan') {
            pushUndo();
            setIsDragging(true);
            
            const initialX = event.clientX - (flipHorizontal ? -editorOffset.x : editorOffset.x);
            const initialY = event.clientY - (flipVertical ? -editorOffset.y : editorOffset.y);
            
            const pos = { x: initialX, y: initialY }

            setCurrentPath([pos]);
        }else if (selectedIndex !== null) {
            const t = texts[selectedIndex];
            
            if (isInsideWrite(pos, t, editorCtx)) {
                pushUndo();
                setIsDragging(true);
                const dragPos = { x: pos.x - t.x, y: pos.y - t.y }
                setDragOffset(dragPos);
            }
        }else {
            //nothing
        }
    };

    /**
     * Handles the pointer move event for updating the drawing path or panning the image.
     */
    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const editorCanvas = editorCanvasRef.current;
        const editorCtx = editorCanvas?.getContext('2d');

        if(!editorCanvas || !editorCtx) return; 

        const pos = getMousePos(event, editorCanvasRef);

        if (action === 'draw' && isDrawing) {
            if (drawTool === 'line' || drawTool === 'arrow' || drawTool === 'circle') {
                setCurrentPath((prev) => (prev.length === 1 ? [prev[0], pos] : [prev[0], pos]));
            } else {
                setCurrentPath((prev) => [...prev, pos]);
            }
        } else if (action === 'pan' && isDragging) {
            event.preventDefault();

            const offsetXDelta = event.clientX - currentPath[0].x;
            const offsetYDelta = event.clientY - currentPath[0].y;

            const newPos = {
                x: flipHorizontal ? -offsetXDelta : offsetXDelta,
                y: flipVertical ? -offsetYDelta : offsetYDelta
            };

            setCurrentPath((prev) => [...prev, newPos]);
            setEditorOffset(newPos);
        }else if (isDragging && selectedIndex !== null) {
            setTexts((prev) => {
                const up = [...prev];
                up[selectedIndex] = { ...up[selectedIndex], x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
                return up;
            });
            setWriteEditorPos({ x: pos.x + 10, y: pos.y + 10 });
        }
    };

    /**
     * Handles the pointer up event for ending the drawing or panning action.
     */
    const handlePointerUp = () => {
        setIsDragging(false);
        setIsDrawing(false);

        if (action === 'draw') finalizeDrawing();
        if (action === 'pan') finalizePanning();
    };

    const handlePointerOut = () => {
        handlePointerUp();
    }

    /**
     * Handles the wheel event for zooming in and out.
     */
    const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
        if(action !== 'pan') return;
        
        if (event.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };

    const finalizeDrawing = () => {
        if (!isDrawing) return;

        if (drawTool === 'line' && currentPath.length === 2) {
            setDrawings((prev) => [
                ...prev,
                { tool: 'line', points: currentPath, color: drawColor, width: brushSize },
            ]);
        } else if (drawTool === 'circle' && currentPath.length === 2) {
            setDrawings((prev) => [
                ...prev,
                { tool: 'circle', points: currentPath, color: drawColor, width: brushSize },
            ]);
        } else if (drawTool === 'arrow' && currentPath.length === 2) {
            setDrawings((prev) => [
                ...prev,
                { tool: 'arrow', points: currentPath, color: drawColor, width: brushSize },
            ]);
        } else if (drawTool === 'eraser') {
            if (currentPath.length > 1){
                setDrawings((prev) => [
                    ...prev,
                    { tool: 'eraser', points: currentPath, width: brushSize, erase: true },
                ]);
            }
        } else if (drawTool === 'pen') {
            if (currentPath.length > 1){
                setDrawings((prev) => [
                    ...prev,
                    { tool: 'pen', points: currentPath, color: drawColor, width: brushSize },
                ]);
            }
        }

        setIsDrawing(false);
        setCurrentPath([]);
    };

    const finalizePanning = () => {
        if (!isDragging) return;

        setPans((prev) => [
            ...prev,
            { points: currentPath }
        ]);

        setIsDragging(false);
        setCurrentPath([]);
    }

    /**
     * Resets the filters and styles to its original state with the default settings.
     */
    const resetFilters = () => {
        setBrightness(scales.brightness);
        setContrast(scales.contrast);
        setSaturate(scales.saturate);
        setGrayscale(scales.grayscale);
        setRotate(positions.rotate);
        setFlipHorizontal(positions.flipHorizontal);
        setFlipVertical(positions.flipVertical);
        setZoom(positions.zoom);

        setEditorOffset(initialCords);
        setIsDragging(false);
        setIsDrawing(false);
        setAction('draw');
        setUndoStack([]);
        setRedoStack([]);

        setDrawTool('pen');
        setDrawings([]);
        setTexts([]);
        setPans([]);
        setFilters([]);
    };

    // Expose the necessary state and handlers for external use.
    return {
        // GENERAL
        /** Reference to the canvas element that contain the image and is filters can be applyed. */
        imageCanvasRef,
        /** Reference to the canvas element that can recieve forms, write and other actions. */
        editorCanvasRef,
        /** Source URL of the image being edited. */
        imageSrc,
        /** Current action ('pan' or 'draw') */
        action,
        /** Map if there are action to undo */
        canUndo,
        /** Map if there are action to redo */
        canRedo,
        /** Current recommended cursor based in action */
        cursor,

        //FILTERS
        /** Array to applyed filters */
        filters,
        /** Current brightness level. */
        brightness,
        /** Current contrast level. */
        contrast,
        /** Current saturation level. */
        saturate,
        /** Current grayscale level. */
        grayscale,
        /** Flag indicating if the image is flipped horizontally. */
        flipHorizontal,
        /** Flag indicating if the image is flipped vertically. */
        flipVertical,
        /** Current zoom level. */
        zoom,
        /** Current rotation angle in degrees. */
        rotate,

        //DRAWING
        /** Flag indicating if the image is being drawing. */
        isDrawing,
        /** Current draw tool ('pen' or 'line' or 'circle' or 'arrow' or 'eraser') */
        drawTool,
        /** Current draw color */
        drawColor,
        /** Current brushSize */
        brushSize,

        //PANNING
        /** Flag indicating if the image is being panning. */
        isDragging,
        
        //WRITTING
        /** Map the offset of the current text */
        writeEditorPos,
        /** The current text to be written */
        writeText,
        writeFontFamily,
        writeFontSize,
        writeColor,
        writeRotation,
        writeScale,

        //SETTERS
        //GENERAL
        /** Function to set the action. */
        setAction,
        /** Function to reset filters and styles to default. */
        resetFilters,
        /** Function to generate the edited image src. */
        generateEditedImage,

        //FILTERS
        /** Function to set the brightness level. */
        setBrightness,
        /** Function to set the contrast level. */
        setContrast,
        /** Function to set the saturation level. */
        setSaturate,
        /** Function to set the grayscale level. */
        setGrayscale,
        /** Function to set the horizontal flip state. */
        setFlipHorizontal,
        /** Function to set the vertical flip state. */
        setFlipVertical,
        /** Function to set the zoom level. */
        setZoom,
        /** Function to set the rotation angle. */
        setRotate,
        
        // DRAWING
        /** Function to set the draw tool (available to action draw). */
        setDrawTool,
        /** Function to set drawing tool's color. */
        setDrawColor,
        /** Function to set drawing tool's size. */
        setBrushSize,

        // WRITTING
        /** Function to set write text. */
        setWriteText,
        /** Function to set write font family. */
        setWriteFontFamily,
        /** Function to set write font size. */
        setWriteFontSize,
        /** Function to set write color. */
        setWriteColor,
        /** Function to set write rotation. */
        setWriteRotation,
        /** Function to set write scale. */
        setWriteScale,
        /** Function to update the current write selected. */
        updateText,

        // HANDLERS
        /** Function to handle zoom undo. */
        handleUndo,
        /** Function to handle zoom redo. */
        handleRedo,
        /** Function to handle canvas click. */
        handleCanvasClick,
        /** Function to handle canvas double click. */
        handleDoubleClick,
        /** Function to handle canvas pointer down. */
        handlePointerDown,
        /** Function to handle canvas pointer move. */
        handlePointerMove,
        /** Function to handle canvas pointer up. */
        handlePointerUp,
        /** Function to handle canvas pointer out. */
        handlePointerOut,
        /** Function to handle canvas wheel. */
        handleWheel,
        /** Function to handle zoom in. */
        handleZoomIn,
        /** Function to handle zoom out. */
        handleZoomOut,
    };
};

export default usePhotoEditor;