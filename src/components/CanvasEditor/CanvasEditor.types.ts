export interface DefaultProps {
    /**
     * free-editor is more like ms paint (no image filters)
     * image-editor is a editor that reacts/custom a given image
     */
    type: 'free-editor' | 'image-editor';

    /**
     * The image source.
     */
    backgroundSrc?: string | undefined;

    /**
     * The canvas height. Default: '500px'
     */
    height?: string;

    /**
     * Function invoked when the edited image is saved.
     * @param image - The edited image src.
     */
    onSaveToImage: (props: ExportToImageProps) => void;

    onCancel?: () => void;

    /**
     * Custom labels or text options for various elements in the photo editor.
     * Use this to override default text for buttons, tooltips, etc.
     *
     * Example:
     * labels: {
     *     close: 'Exit',
     *     save: 'Apply Changes',
     *     rotate: 'Turn',
     * }
     */
    labels?: TranslationsProps;
    
    /**
     * Set loading style effects
     */
    loading?: boolean;

    /**
     * Add custom css class to de main container
     */
    className?: string;
    
    /**
     * Add custom css to main container
     */
    style?: object;
}

export interface ExportToImageProps {
    src: any,
    e?: any
};

export interface TranslationsProps {
    arrow: LabelProps,
    brightness: LabelProps,
    cancel: LabelProps,
    circle: LabelProps,
    contrast: LabelProps,
    draw: LabelProps,
    eraser: LabelProps,
    filters: LabelProps,
    grayscale: LabelProps,
    line: LabelProps,
    pan_zoom: LabelProps,
    pen: LabelProps,
    redo: LabelProps,
    restore: LabelProps,
    rotate: LabelProps,
    save: LabelProps,
    shapes: LabelProps,
    settings: LabelProps,
    saturate: LabelProps,
    undo: LabelProps,
    zoom: LabelProps
}

export interface LabelProps {
    txt: string;
    icon?: React.ReactNode;
};