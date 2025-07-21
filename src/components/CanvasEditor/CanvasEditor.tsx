import React, { FC, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { DefaultProps } from './CanvasEditor.types';
import { handleCssClassnames } from '@gadeoli/js-helpers-library';
import { Container, useTheme } from '@gadeoli/rjs-component-library-themed';
import { addDrawingCommand, defaultLabels, renderDrawingsLayer } from './utils/helpers';
import useEditorEngine from './hooks/useEditorEngine';
import { EditorState } from './hooks/useEditorEngine.types';
import { strokes } from './utils/mockCommands';

const initialState: EditorState = {
    backgroundImage: null,
    objects: [],
    selectedObjectIds: []
};

const CanvasEditor: FC<DefaultProps> = ({
    type='image-editor',
    backgroundSrc,
    onExportToImage,
    labels=defaultLabels,
    loading,
    className,
    style
}) => {

    const { theme } = useTheme();
    const editorEngine = useEditorEngine(initialState);
    const {
        containerRef,
        canvasRefs,
        contexts,
        dispatch,
        getState,

        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerOut,
        handlePointerEnter
    } = editorEngine;

    const classNames = handleCssClassnames([
        'cl-canvas-editor',
        loading ? 'loading-effect' : undefined,
        type === 'image-editor' && !backgroundSrc ? 'hidden-editor' : undefined,
        className
    ]);

    const classNamesCanvas = useMemo(() => handleCssClassnames([
        'cl-canvas-layer',
        type === 'image-editor' ? 'layer-size-fixed' : 'layer-size-free'
    ]), [type]);

    useEffect(() => {
        dispatch(addDrawingCommand(strokes[0]))
    }, [dispatch]);

    useEffect(() => {
        const ctx = contexts.drawings;

        if (!ctx) return;
        
        renderDrawingsLayer(getState(), ctx);
    })

    return <Container type='clean' className={classNames} style={style}>
        <CanvasContainer ref={containerRef} theme={theme}>
            <Canvas 
                ref={canvasRefs.background} 
                $index={1} 
                className={`${classNamesCanvas} layer-bg`}

                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerOut={handlePointerOut}
                onPointerEnter={handlePointerEnter}
            />
            <Canvas ref={canvasRefs.drawings} $index={1} className={`${classNamesCanvas} layer-drawings layer-editor`}/>
            <Canvas ref={canvasRefs.texts} $index={1} className={`${classNamesCanvas} layer-texts layer-editor`}/>
            <Canvas ref={canvasRefs.interactions} $index={1} className={`${classNamesCanvas} layer-inters layer-editor`}/>
        </CanvasContainer>
    </Container>;
}

export default CanvasEditor;

const CanvasContainer = styled.div`
    background-color: ${props => props.theme.background};
    box-sizing: border-box;
    position: relative;
    display: flex;
    justify-content: center;
    position: relative;

    &.hidden-editor{
        display: none;
    }
`;

const Canvas = styled.canvas<{$index: number}>`
    width: auto;
    height: auto;
    inset: 0;
    z-index: ${props => props.$index * 10};
    
    &.layer-size-fixed{
        max-height: 26rem;
        max-width: 70%;
    }

    &.layer-size-free{
        max-height: 100%;
        max-width: 100%;
    }

    &.layer-editor{
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    &.layer-inters{
        pointer-events: none;
    }
`;