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
    onExportToImage: (props: ExportToImageProps) => void;

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
    circle: LabelProps,
    draw: LabelProps,
    redo: LabelProps,
    restore: LabelProps,
    settings: LabelProps,
    eraser: LabelProps,
    line: LabelProps,
    pen: LabelProps,
    shapes: LabelProps,
    undo: LabelProps,
}

export interface LabelProps {
    txt: string;
    icon?: React.ReactNode;
};