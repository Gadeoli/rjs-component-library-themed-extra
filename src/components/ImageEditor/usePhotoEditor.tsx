import { useEffect, useRef, useState } from "react";
import { UseImageEditorProps } from "./ImageEditor.types";

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
        line: {
            color: '#000000',
            width: 12,
            style: 'hand-free'
        },
        text: {
            color: "#FFEF00",
            font: 'Times New Roman',
            fontSize: 12
        }
    }
}: UseImageEditorProps) => {
    const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const imgRef = useRef(new Image());
    const drawingPathsRef = useRef<
        { path: { x: number; y: number }[]; color: string; width: number }[]
    >([]);

    //state
    const [imageSrc, setImageSrc] = useState<string>('');
    const [action, setAction] = useState<'draw' | 'pan' | 'flip' | 'write'>(actions.mode);
    const [history, setHistory] = useState();
    //filters
    const [brightness, setBrightness] = useState(scales.brightness);
    const [contrast, setContrast] = useState(scales.contrast);
    const [saturate, setSaturate] = useState(scales.saturate);
    const [grayscale, setGrayscale] = useState(scales.grayscale);
    const [flipHorizontal, setFlipHorizontal] = useState(positions.flipHorizontal);
    const [flipVertical, setFlipVertical] = useState(positions.flipVertical);
    const [zoom, setZoom] = useState(positions.zoom);
    const [rotate, setRotate] = useState(positions.rotate);
    //## handling drag-and-drop panning.
    const [isDragging, setIsDragging] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    //## drawing on the canvas.
    const [lineColor, setLineColor] = useState<string>(actions.line.color);
    const [lineWidth, setLineWidth] = useState<number>(actions.line.width);
    const [lineStyle, setLineStyle] = useState<'hand-free' | 'straight'>(actions.line.style);
    //## write on the canvas.
    const [textColor, setTextColor] = useState<string>(actions.text.color);
    const [textFont, setTextFont] = useState<string>(actions.text.font);
    const [textFontSize, setTextFontSize] = useState<number>(actions.text.fontSize);
    //State - end    

    // Effect to update the image source when the src changes.
    useEffect(() => {
        setImageSrc(src ? src : '');
        resetFilters();
    }, [src]);

    // Effect to apply transformations and filters whenever relevant state changes.
    useEffect(() => {
        applyFilter();
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
        offsetX,
        offsetY,
    ]);

    const redrawDrawingPaths = (context: CanvasRenderingContext2D) => {
        drawingPathsRef.current.forEach(({ path, color, width }) => {
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = width;
            context.lineCap = 'round';
            context.lineJoin = 'round';

            path.forEach((point, index) => {
                if (index === 0) {
                    context.moveTo(point.x, point.y);
                } else {
                    context.lineTo(point.x, point.y);
                }
            });
            context.stroke();
        });
    };

    /**
     * Applies the selected filters and transformations to the image on the canvas.
     */
    const applyFilter = () => {
        if (!imageSrc) return;

        const imageCanvas = imageCanvasRef.current;
        const imageCtx = imageCanvas?.getContext('2d');

        const editorCanvas = editorCanvasRef.current;
        const editorCtx = editorCanvas?.getContext('2d');

        const imgElement = imgRef.current;
        imgRef.current.src = imageSrc;
        imgRef.current.onload = applyFilter;

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

                imageCtx.translate(translateX + offsetX, translateY + offsetY);
                imageCtx.scale(zoom, zoom);
                imageCtx.drawImage(imgElement, 0, 0, imageCanvas.width, imageCanvas.height);
                imageCtx.restore();
                imageCtx.filter = 'none';

                editorCtx.translate(translateX + offsetX, translateY + offsetY);
                editorCtx.scale(zoom, zoom);
                imageCtx.restore();
                imageCtx.filter = 'none';
                redrawDrawingPaths(editorCtx);
            }
        };
    };

    /**
     * Generates a image source from the canvas content.
     * @returns {Promise<string | null>} A promise that resolves with the edited image src or null if the canvas is not available.
     */
    const generateEditedImage = (): Promise<string | null> => {
        return new Promise((resolve) => {
            const imageCanvas = imageCanvasRef.current;
            const editorCanvas = editorCanvasRef.current;

            if(!imageCanvas){
                resolve(null);
                return;
            };

            const layersCanvas = [
                imageCanvas, //let in first position
                editorCanvas
            ];

            const mergedCanvas = document.createElement('canvas');
            mergedCanvas.width = imageCanvas.width;
            mergedCanvas.height = imageCanvas.height;
            const mergedCtx = mergedCanvas.getContext('2d');

            let cnvCounter = 0;

            layersCanvas.forEach((cnv) => {
                if(cnv){
                    const dataURL = cnv.toDataURL();
                    const image = new Image();

                    image.onload = () => {
                        mergedCtx?.drawImage(image, 0, 0);
                        cnvCounter++;

                        if(cnvCounter === layersCanvas.length){
                            resolve(mergedCanvas.toDataURL('image/png'));
                        }
                    }

                    image.src = dataURL;
                }
            })
        });
    };

    /**
     * Generates a string representing the current filter settings.
     *
     * @returns {string} - A CSS filter string.
     */
    const getFilterString = (): string => {
        return `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) saturate(${saturate}%)`;
    };

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

    /**
     * Handles the pointer down event for initiating drawing or drag-and-drop panning.
     */
    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (action === 'draw') {
            const canvas = editorCanvasRef.current;
            
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;
            
            setDrawStart({ x, y });

            drawingPathsRef.current.push({ path: [{ x, y }], color: lineColor, width: lineWidth });
        } else if (action === 'pan') {
            setIsDragging(true);
            
            const initialX = event.clientX - (flipHorizontal ? -offsetX : offsetX);
            const initialY = event.clientY - (flipVertical ? -offsetY : offsetY);
            
            setPanStart({ x: initialX, y: initialY });
        } else {
            //nothing
        }
    };

    /**
     * Handles the pointer move event for updating the drawing path or panning the image.
     */
    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (action === 'draw' && drawStart) {
            const canvas = editorCanvasRef.current;
            const context = canvas?.getContext('2d');
            const rect = canvas?.getBoundingClientRect();

            if (!canvas || !context || !rect) return;

            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;
            const currentPath = drawingPathsRef.current[drawingPathsRef.current.length - 1].path;

            context.strokeStyle = lineColor;
            context.lineWidth = lineWidth;
            context.lineCap = 'round';
            context.lineJoin = 'round';

            context.beginPath();
            context.moveTo(drawStart.x, drawStart.y);
            context.lineTo(x, y);
            context.stroke();

            setDrawStart({ x, y });
            
            currentPath.push({ x, y });

            return;
        }

        if (isDragging && panStart) {
            event.preventDefault();

            const offsetXDelta = event.clientX - panStart.x;
            const offsetYDelta = event.clientY - panStart.y;

            setOffsetX(flipHorizontal ? -offsetXDelta : offsetXDelta);
            setOffsetY(flipVertical ? -offsetYDelta : offsetYDelta);
        }
    };

    /**
     * Handles the pointer up event for ending the drawing or panning action.
     */
    const handlePointerUp = () => {
        setIsDragging(false);
        setDrawStart(null);
    };

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
        setLineColor(actions.line.color);
        setLineWidth(actions.line.width);
        setLineStyle('hand-free');
        drawingPathsRef.current = [];
        setOffsetX(0);
        setOffsetY(0);
        setPanStart(null);
        setIsDragging(false);
        setAction('draw');
        applyFilter();
        setTextColor(actions.text.color);
        setTextFont(actions.text.font);
        setTextFontSize(actions.text.fontSize);
    };

    // Expose the necessary state and handlers for external use.
    return {
        /** Reference to the canvas element that contain the image and is filters can be applyed. */
        imageCanvasRef,
        /** Reference to the canvas element that can recieve forms, write and other actions. */
        editorCanvasRef,
        /** Source URL of the image being edited. */
        imageSrc,
        /** Current brightness level. */
        brightness,
        /** Current contrast level. */
        contrast,
        /** Current saturation level. */
        saturate,
        /** Current grayscale level. */
        grayscale,
        /** Current rotation angle in degrees. */
        rotate,
        /** Flag indicating if the image is flipped horizontally. */
        flipHorizontal,
        /** Flag indicating if the image is flipped vertically. */
        flipVertical,
        /** Current zoom level. */
        zoom,
        /** Flag indicating if the image is being dragged. */
        isDragging,
        /** Starting coordinates for panning. */
        panStart,
        /** Current horizontal offset for panning. */
        offsetX,
        /** Current vertical offset for panning. */
        offsetY,
        /** Current action ('pan' or 'draw') */
        action,
        /** Current actions history */
        history,
        /** Current line color. */
        lineColor,
        /** Current line width. */
        lineWidth,
        /** Current line style - hand-free or straight - default: hand-free */
        lineStyle,
        /** Current text color */
        textColor,
        /** Current text font */
        textFont,
        /** Current text font size */
        textFontSize,
        /** Function to set the brightness level. */
        setBrightness,
        /** Function to set the contrast level. */
        setContrast,
        /** Function to set the saturation level. */
        setSaturate,
        /** Function to set the grayscale level. */
        setGrayscale,
        /** Function to set the rotation angle. */
        setRotate,
        /** Function to set the horizontal flip state. */
        setFlipHorizontal,
        /** Function to set the vertical flip state. */
        setFlipVertical,
        /** Function to set the zoom level. */
        setZoom,
        /** Function to set the dragging state. */
        setIsDragging,
        /** Function to set the starting coordinates for panning. */
        setPanStart,
        /** Function to set the horizontal offset for panning. */
        setOffsetX,
        /** Function to set the vertical offset for panning. */
        setOffsetY,
        /** Function to zoom in. */
        handleZoomIn,
        /** Function to zoom out. */
        handleZoomOut,
        /** Function to handle pointer down events. */
        handlePointerDown,
        /** Function to handle pointer up events. */
        handlePointerUp,
        /** Function to handle pointer move events. */
        handlePointerMove,
        /** Function to handle wheel events for zooming. */
        handleWheel,
        /** Function to generate the edited image src. */
        generateEditedImage,
        /** Function to reset filters and styles to default. */
        resetFilters,
        /** Function to apply filters and transformations. */
        applyFilter,
        /** Function to set the action. */
        setAction,
        /** Function to set history */
        setHistory,
        /** Function to set the line color. */
        setLineColor,
        /** Function to set the line width. */
        setLineWidth,
        /** Function to set the line style */
        setLineStyle,
        /** Function to set the text color */
        setTextColor,
        /** Function to set the text font */
        setTextFont,
        /** Function to set the text font size */
        setTextFontSize
    };
};

export default usePhotoEditor;