import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { 
    DRAW_TOOLS,
    drawArrow,
    drawArrowMove,
    drawCircle,
    drawCircleMove,
    drawLine,
    drawLineMove,
    drawPath,
    drawPathMove,
    drawText,
    FILTERS,
    generateCanvasImage, 
    getCanvasPtToPx, 
    getMetrics, 
    getMousePos, 
    initialCords, 
    isInsideWrite, 
    MODES
} from "./helpers";
import { useOnPressKey, usePrevious } from "@gadeoli/rjs-hooks-library";
import { debounce } from "../../helpers";
import useWindowScrollLock from "./useWindowScrollLock";
import { 
    commonBrushSizesPt,
    commonFontSizesPt,
    getBestBrushSizePt, 
    getBestFontSizesPt, 
 } from "../../helpers/editor";

/**
 * A hook to control double canvas layer
 * One layer for image and filters and another canvas for drawings
 * All handles and params need to be implemented into the canvas image (main canvas) to proper function of the hook (search for story or example for more info):
 *  //canvas image
 *  - ref
    - onPointerDown
    - onPointerMove
    - onPointerUp
    - onPointerOut
    - onPointerEnter
    - onWheel
    - onClick
    - onDoubleClick
 *  //canvas editor
    - ref
 */
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
        mode: MODES.DRAW,
        drawSettings: {
            tool: DRAW_TOOLS.PEN,
            color: "#000000",
            size: commonBrushSizesPt[4]
        },
        writeSettings: {
            text: '',
            font: 'Arial',
            fontSize: commonFontSizesPt[2],
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
    
    const suppressHistoryRef = useRef<boolean>(false);
    const canvasInsideRef = useRef<boolean>(false); //keep info if pointer is inside canvas
    const filterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const imgRef = useRef(new Image());

    //state
    //general
    const [imageSrc, setImageSrc] = useState<string>('');
    const [action, setAction] = useState<ModesType>(actions.mode);
    const [undoStack, setUndoStack] = useState<UndoRedoItemProps[]>([]);
    const [canUndo, setCanUndo] = useState<boolean>(false);
    const [redoStack, setRedoStack] = useState<UndoRedoItemProps[]>([]);
    const [canRedo, setCanRedo] = useState<boolean>(false);
    const [canUnPanning, setCanUnPanning] = useState<boolean>(false);
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
    const [filtersSnapshot, setFiltersSnapshot] = useState<string | null>(null);
    const prevFiltersSnapshot = usePrevious(filtersSnapshot);
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
    
    //custom hooks
    const { enableScrollLock, disableScrollLock } = useWindowScrollLock();

    const getDefaultFiltersSnapshot = useMemo(() => {
        return {
            rotate: positions.rotate,
            flipHorizontal: positions.flipHorizontal,
            flipVertical: positions.flipVertical,
            zoom: positions.zoom,
            brightness: scales.brightness,
            contrast: scales.contrast,
            saturate: scales.saturate,
            grayscale: scales.grayscale,
            editorOffset: initialCords,
        }
    }, []);

    const getFiltersSnapshot = () => {
        return {
            rotate,
            flipHorizontal,
            flipVertical,
            zoom,
            brightness,
            contrast,
            saturate,
            grayscale,
            editorOffset,
        }
    }

    const withSuppressedHistory = (fn: () => void) => {
        suppressHistoryRef.current = true;
        fn();
        setTimeout(() => {
            suppressHistoryRef.current = false;
        }, 0);
    };

    // Effect to update the image source when the src changes.
    useEffect(() => {
        setImageSrc(src ? src : '');
        resetEditor();
    }, [src]);

    // Effect to apply transformations and filters whenever relevant state changes.
    useEffect(() => {
        applyFilters();

        const snap = JSON.stringify(getFiltersSnapshot());
        setFiltersSnapshot(snap);
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

    /**
     * Generates a string representing the current filter settings.
     *
     * @returns {string} - A CSS filter string.
     */
    const getFilterString = (): string => {
        return `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) saturate(${saturate}%)`;
    };

    useEffect(() => {        
        if(
            filtersSnapshot && prevFiltersSnapshot && 
            filtersSnapshot !== prevFiltersSnapshot && 
            !suppressHistoryRef.current 
        ){
            setFilters([...filters, filtersSnapshot]);
            pushUndo();
        }
    }, [filtersSnapshot]);

    useEffect(() => {
        const pxWriteFontSize = getCanvasPtToPx(writeFontSize);
        const newFont = `${pxWriteFontSize}px ${writeFontFamily}`;
        setWriteFont(newFont);
    }, [writeFontSize, writeFontFamily]);

    useEffect(() => {
        setCanRedo(redoStack.length !== 0);
        setCanUndo(undoStack.length !== 0);
    }, [undoStack.length, redoStack.length]);

    useEffect(() => {
        let c = '';

        if(action === MODES.DRAW){
            c =  'crosshair';
        }else if(action === MODES.PAN){
            c = 'grab';
        }else{
            c = 'default';
        }

        setCursor(c);
    }, [action]);

    useEffect(() => {
        const imageTest = new Image();
        imageTest.src = imageSrc;
        imageTest.onload = () => {
            const biggerSize = imageTest.width >= imageTest.height ? imageTest.width : imageTest.height;
            setBrushSize(getBestBrushSizePt(biggerSize));
            setWriteFontSize(getBestFontSizesPt(biggerSize));
        }
    }, [imageSrc]);

    useEffect(() => {
        setCanUnPanning(zoom !== 1 || pans.length >= 1);
    }, [zoom, pans.length]);

    const applyDraws = useCallback(() => {
        const editorCanvas = editorCanvasRef.current;
        const editorCtx = editorCanvas?.getContext('2d');
        const pxBrushSize = getCanvasPtToPx(brushSize);

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

            if (drawing.tool === DRAW_TOOLS.LINE) drawLine(editorCtx, drawing);
            else if (drawing.tool === DRAW_TOOLS.CIRCLE) drawCircle(editorCtx, drawing);    
            else if (drawing.tool === DRAW_TOOLS.ARROW) drawArrow(editorCtx, drawing); 
            else drawPath(editorCtx, drawing); 

            editorCtx.restore();
        });

        // Preview current in-progress drawing
        if (isDrawing && currentPath.length) {
            editorCtx.save();
            editorCtx.lineCap = 'round';
            editorCtx.lineJoin = 'round';
            editorCtx.lineWidth = pxBrushSize;

            if (drawTool === DRAW_TOOLS.ERASER) {
                editorCtx.globalCompositeOperation = 'destination-out';
                editorCtx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                editorCtx.globalCompositeOperation = 'source-over';
                editorCtx.strokeStyle = drawColor;
            }

            if (drawTool === DRAW_TOOLS.LINE && currentPath.length === 2) drawLineMove(editorCtx, currentPath);
            else if (drawTool === DRAW_TOOLS.CIRCLE && currentPath.length === 2) drawCircleMove(editorCtx, currentPath);
            else if (drawTool === DRAW_TOOLS.ARROW && currentPath.length === 2) drawArrowMove(editorCtx, currentPath, pxBrushSize, drawColor);
            else if (drawTool === DRAW_TOOLS.PEN) drawPathMove(editorCtx, currentPath);

            editorCtx.restore();
        }

        // Render texts
        texts.forEach((t, i) => {
            drawText(editorCtx, t);

            if (i === selectedIndex) {
                const { width, height } = getMetrics(t, editorCtx);
                editorCtx.strokeStyle = 'red';
                editorCtx.strokeRect(0, 0, width, height);
            }

            editorCtx.restore();
        }); 
    }, [
        editorCanvasRef,
        drawings,
        isDrawing,
        currentPath,
        brushSize,
        drawTool,
        drawColor,
        texts,
        selectedIndex
    ]);

    /**
     * Applies the selected filters and transformations to image canvas.
     * And Set size and offset for both canvas
     */
    const applyFilters = useCallback(debounce(() => {
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

                applyDraws();
            }
        };
    }, 250), [
        imageSrc,
        imageCanvasRef,
        editorCanvasRef,
        imgRef,
        
        zoom,
        rotate,
        flipHorizontal,
        flipVertical,
        editorOffset,
        getFilterString
    ]);

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

    const setFilterValue = (value : any, filter: FILTERS, delay = 20) => {
        if(filterTimeoutRef.current){
            clearTimeout(filterTimeoutRef.current);
        }

        filterTimeoutRef.current = setTimeout(() => {
            switch (filter) {
                case FILTERS.BRIGHTNESS: setBrightness(value); break;
                case FILTERS.CONTRAST: setContrast(value); break;
                case FILTERS.GRAYSCALE: setGrayscale(value); break;
                case FILTERS.ROTATE: setRotate(value); break;
                case FILTERS.SATURATE: setSaturate(value); break;
                case FILTERS.ZOOM: setZoom(value); break;
                default: break;
            }

            filterTimeoutRef.current = null;
        }, delay);
    }

    // IMAGE HANDLES
    /**
     * Handles the zoom-in action.
     */
    const handleZoomIn = () => {
        setZoom((prevZoom) => (Number)(prevZoom.toFixed(2)) + 0.1);
    };

    /**
     * Handles the zoom-out action.
     */
    const handleZoomOut = () => {
        setZoom((prevZoom) => (Number)(prevZoom.toFixed(2)) - 0.1);
    };

    // EDITOR HANDLES
    const pushUndo = () => {
        if (suppressHistoryRef.current) return;

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

    const handlePansStackChange = ({handledPans, type} : {handledPans: any[], type: 'undo' | 'redo'}) => {     
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

    const handleFiltersStackChange = ({handledFilters, type} : {handledFilters: any[], type: 'undo' | 'redo'}) => {
        const unstacked = 
            handledFilters.length >= 2 && type === 'undo' ? handledFilters[handledFilters.length - 2] :
            handledFilters.length && type === 'redo' ? handledFilters[handledFilters.length - 1] :
            null;

        if(!unstacked){
            resetFilters();
            return;
        }

        if(unstacked === filtersSnapshot) return;

        try {
            const stackedFilters = JSON.parse(unstacked);

            const updates: [any, any, React.Dispatch<any>][] = [
                [stackedFilters.rotate, rotate, setRotate],
                [stackedFilters.flipHorizontal, flipHorizontal, setFlipHorizontal],
                [stackedFilters.flipVertical, flipVertical, setFlipVertical],
                [stackedFilters.zoom, zoom, setZoom],
                [stackedFilters.brightness, brightness, setBrightness],
                [stackedFilters.contrast, contrast, setContrast],
                [stackedFilters.saturate, saturate, setSaturate],
                [stackedFilters.grayscale, grayscale, setGrayscale],
                [stackedFilters.editorOffset, editorOffset, setEditorOffset],
            ];

            updates.forEach(([stackedVal, currentVal, setter]) => {
                if(stackedVal !== currentVal) setter(stackedVal);
            });
            
            setFiltersSnapshot(unstacked);
        } catch (error) {
            console.error("Failed to parse filter snapshot:", error);
        }
    }
 
    const handleUndo = () => {
        if (!undoStack.length) return;

        withSuppressedHistory(() => {
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

            handlePansStackChange({handledPans: pans, type: 'undo'});
            handleFiltersStackChange({handledFilters: filters, type: 'undo'});

            setTexts(prev.texts);
            setDrawings(prev.drawings);
            setPans(prev.pans);
            setFilters(prev.filters),
            setSelectedIndex(null);
        })
    };

    const handleUndoKeyClick = useCallback(debounce(() => {
        if(canvasInsideRef && canvasInsideRef.current && canUndo) handleUndo();
    }, 100), [canUndo, handleUndo, canvasInsideRef?.current]);

    const handleRedo = () => {
        if (!redoStack.length) return;

        withSuppressedHistory(() => {
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

            handlePansStackChange({handledPans: next.pans, type: 'redo'});
            handleFiltersStackChange({handledFilters: next.filters, type: 'redo'});

            setTexts(next.texts);
            setDrawings(next.drawings);
            setPans(next.pans);
            setFilters(next.filters)
            setSelectedIndex(null);
        })
    };

    const handleRedoKeyClick = useCallback(debounce(() => {
        if(canvasInsideRef && canvasInsideRef.current && canRedo) handleRedo();
    }, 100), [canUndo, handleRedo, canvasInsideRef?.current]);

    /**
     * Handles the canvas image click and handle tools in canvas editor.
     */
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const editorCanvas = editorCanvasRef.current;
        const editorCtx = editorCanvas?.getContext('2d');

        if(!editorCanvas || !editorCtx || action !== 'write') return; 
        
        const pos = getMousePos(
            e, 
            editorCanvasRef, 
            editorOffset, 
            zoom, 
            flipHorizontal, 
            flipVertical,
            rotate
        );
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
        const pos = getMousePos(
            e, 
            editorCanvasRef, 
            editorOffset, 
            zoom, 
            flipHorizontal, 
            flipVertical,
            rotate
        );
        const pxWriteFontSize = getCanvasPtToPx(writeFontSize);

        const newText: TextItemProps = {
          text: labels.writeInitial,
          x: pos.x,
          y: pos.y,
          font: writeFont,
          fontSize: pxWriteFontSize,
          color: writeColor,
          rotation: 0,
          scale: 1,
        };
        
        setTexts((prev) => [...prev, newText]);
        setWriteText(labels.writeInitial);
        setWriteRotation(0);
        setWriteScale(1);
        setWriteEditorPos({ x: pos.x, y: pos.y});
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

        //This pos is ok, but got when if zoom or panning previous
        const pos = getMousePos(
            event, 
            editorCanvasRef, 
            editorOffset, 
            zoom, 
            flipHorizontal, 
            flipVertical,
            rotate
        );

        if (action === MODES.DRAW) {
            pushUndo();
            setIsDrawing(true);

            if (drawTool === DRAW_TOOLS.LINE || drawTool === DRAW_TOOLS.ARROW || drawTool === DRAW_TOOLS.CIRCLE) {
                setCurrentPath([pos]); // start point
            } else {
                setCurrentPath([pos]);
            }
        }else if (action === MODES.PAN) {
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

        const pos = getMousePos(
            event, 
            editorCanvasRef, 
            editorOffset, 
            zoom, 
            flipHorizontal, 
            flipVertical,
            rotate
        );

        if (action === MODES.DRAW && isDrawing) {
            if (drawTool === DRAW_TOOLS.LINE || drawTool === DRAW_TOOLS.ARROW || drawTool === DRAW_TOOLS.CIRCLE) {
                setCurrentPath((prev) => (prev.length === 1 ? [prev[0], pos] : [prev[0], pos]));
            } else {
                setCurrentPath((prev) => [...prev, pos]);
            }
        } else if (action === MODES.PAN && isDragging) {
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
            setWriteEditorPos({ x: pos.x, y: pos.y});
        }
    };

    /**
     * Handles the pointer up event for ending the drawing or panning action.
     */
    const handlePointerUp = () => {
        setIsDragging(false);
        setIsDrawing(false);

        if (action === MODES.DRAW) finalizeDrawing();
        if (action === MODES.PAN) finalizePanning();
    };

    const handlePointerOut = () => {
        canvasInsideRef.current = false;
        handlePointerUp();
        disableScrollLock();
    }

    const handlePointerEnter = () => {
        canvasInsideRef.current = true;
        enableScrollLock();
    }

    /**
     * Handles the wheel event for zooming in and out.
     */
    const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {        
        if (event.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };

    const finalizeDrawing = () => {
        const pxBrushSize = getCanvasPtToPx(brushSize, zoom);

        if (!isDrawing) return;

        let newItemTool : DrawingItemProps = {
            tool: drawTool,
            points: currentPath,
            width: pxBrushSize
        };

        if(drawTool === DRAW_TOOLS.ERASER){
            newItemTool.erase = true;
        }else{
            newItemTool.color = drawColor;
        }

        if(
            ((drawTool !== DRAW_TOOLS.ERASER && drawTool !== DRAW_TOOLS.PEN) && currentPath.length === 2) ||
            ((drawTool === DRAW_TOOLS.ERASER || drawTool === DRAW_TOOLS.PEN) && currentPath.length > 1)
        ){
            setDrawings((prev) => [
                ...prev,
                newItemTool
            ]);
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
        const snap = JSON.stringify(getDefaultFiltersSnapshot);

        setBrightness(scales.brightness);
        setContrast(scales.contrast);
        setSaturate(scales.saturate);
        setGrayscale(scales.grayscale);
        setRotate(positions.rotate);
        setFlipHorizontal(positions.flipHorizontal);
        setFlipVertical(positions.flipVertical);
        setZoom(positions.zoom);
        setFiltersSnapshot(snap);
    };

    const resetPanning = () => {
        setZoom(1);
        setEditorOffset(initialCords);
        setPans([]);
        applyFilters();
    }

    const resetEditor = () => {
        resetFilters();

        setEditorOffset(initialCords);
        setRedoStack([]);
        setUndoStack([]);
        
        setIsDragging(false);
        setIsDrawing(false);
        
        setDrawings([]);
        setTexts([]);
        setPans([]);
        setFilters([]);

        setAction(MODES.DRAW);
        setDrawTool(DRAW_TOOLS.PEN);
    }

    // Extra
    // custom hooks - 2
    useOnPressKey(90, handleUndoKeyClick, "ctrlKey");
    useOnPressKey(89, handleRedoKeyClick, "ctrlKey");

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
        /** Map if there are change in zoom or panning */
        canUnPanning,
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
        /** Function to reset the editor to default. */
        resetEditor,
        /** Function to reset panning and zoom to default ({0, 0} and zoom 1) */
        resetPanning,
        /** Function to generate the edited image src. */
        generateEditedImage,

        //FILTERS
        /** Function to set some image filters to avoid maximum set state limit. replace: setBrightness, setContrast, setSaturate, setGrayscale, setZoom, setRotate*/
        setFilterValue,
        /** Function to set the brightness level. */
        // setBrightness,
        /** Function to set the contrast level. */
        // setContrast,
        /** Function to set the saturation level. */
        // setSaturate,
        /** Function to set the grayscale level. */
        // setGrayscale,
        /** Function to set the zoom level. */
        // setZoom,
        /** Function to set the rotation angle. */
        // setRotate,
        /** Function to set the horizontal flip state. */
        setFlipHorizontal,
        /** Function to set the vertical flip state. */
        setFlipVertical,
        
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
        /** Function to handle canvaas click. */
        handleClick,
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
        /** Function to handle canvas pointer in. */
        handlePointerEnter,
        /** Function to handle canvas wheel. */
        handleWheel,
        /** Function to handle zoom in. */
        handleZoomIn,
        /** Function to handle zoom out. */
        handleZoomOut,
    };
};

export default usePhotoEditor;