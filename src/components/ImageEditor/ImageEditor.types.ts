import React from "react";

export interface DefaultProps {
    /**
     * The image source.
     */
    src: string | undefined;

    actions: ActionsProps;

    /**
     * Function invoked when the edited image is saved.
     * @param image - The edited image src.
     */
    onSaveImage: (props: ImageOnSaveProps) => void;

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

export interface ImageOnSaveProps {
    src: any,
    e?: any
};

export interface ActionsProps {
    /**
     * Whether to allow color editing options.
     * @default true
     */
    colorEditing?: boolean;

    /**
     * Whether to allow rotation of the image.
     * @default true
     */
    rotate?: boolean;

    /**
     * Whether to allow flipping (horizontal/vertical) of the image.
     * @default true
     */
    flip?: boolean;

    /**
     * Whether to allow zooming of the image.
     * @default true
     */
    zoom?: boolean;

    /**
     * Whether to enable drawing options.
     * @default true
     */
    drawing?: boolean;

    /**
     * Whether to enable write options.
     * @default true
     */
    write?: boolean;
}

export interface TranslationsProps {
    arrow: LabelProps;
    brushColor: LabelProps;
    brushWidth: LabelProps;
    brightness: LabelProps;
    circle: LabelProps;
    contrast: LabelProps;
    controls: LabelProps,
    draw: LabelProps;
    emptySelect: LabelProps;
    eraser: LabelProps;
    flip: LabelProps;
    grayscale: LabelProps;
    horizontal: LabelProps;
    line: LabelProps;
    pan: LabelProps;
    pen: LabelProps;
    reset: LabelProps;
    rotate: LabelProps;
    saturate: LabelProps;
    save: LabelProps;
    vertical: LabelProps;
    zoom: LabelProps;
    write: LabelProps;
}

export interface LabelProps {
    txt: string;
    icon?: React.ReactNode;
};