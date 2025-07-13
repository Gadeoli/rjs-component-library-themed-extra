import React from "react";

export interface ImageEditorProps {
    /**
     * The image source.
     */
    src: string | undefined;

    actions: ImageEditorActionsProps;

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
    labels?: ImageEditorTranslationsProps;

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

export interface ImageEditorActionsProps {
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
}

export interface ImageEditorTranslationsProps {
    brushColor: ImageEditorLabelProps;
    brushWidth: ImageEditorLabelProps;
    brightness: ImageEditorLabelProps;
    contrast: ImageEditorLabelProps;
    draw: ImageEditorLabelProps;
    flip: ImageEditorLabelProps;
    grayscale: ImageEditorLabelProps;
    horizontal: ImageEditorLabelProps;
    pan: ImageEditorLabelProps;
    reset: ImageEditorLabelProps;
    rotate: ImageEditorLabelProps;
    saturate: ImageEditorLabelProps;
    save: ImageEditorLabelProps;
    vertical: ImageEditorLabelProps;
    zoom: ImageEditorLabelProps;
    write: ImageEditorLabelProps;
}

export interface ImageEditorLabelProps {
    txt: string;
    icon?: React.ReactNode;
};

export interface UseImageEditorProps {
    src?: string;
    scales?: UseImageEditorScalesProps;
    positions?: UseImageEditorPositionsProps;
    actions?: UseImageEditorActionsProps;
};

interface UseImageEditorScalesProps {
    brightness: number;
    contrast: number;
    saturate: number;
    grayscale: number;
};

interface UseImageEditorPositionsProps {
    flipHorizontal: boolean;
    flipVertical: boolean;
    zoom: number;
    rotate: number;
};

interface UseImageEditorLineProps {
    color: string;
    width: number;
    style: 'hand-free' | 'straight';
};

interface UseImageEditorTextProps {
    color: string;
    font: string;
    fontSize: number;
};

interface UseImageEditorActionsProps {
    mode: 'pan' | 'draw' | 'flip' | 'write';
    line: UseImageEditorLineProps;
    text: UseImageEditorTextProps;
};