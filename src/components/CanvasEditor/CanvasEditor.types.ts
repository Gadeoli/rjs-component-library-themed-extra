export interface DefaultProps {
    type: 'free-editor' | 'image-editor',

    /**
     * The image source.
     */
    backgroundSrc?: string | undefined;

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
    
}

export interface LabelProps {
    txt: string;
    icon?: React.ReactNode;
};