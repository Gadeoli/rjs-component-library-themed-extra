import React, { FC, MouseEventHandler, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { DefaultProps, LabelProps, TranslationsProps } from './CanvasEditor.types';
import { handleCssClassnames } from '@gadeoli/js-helpers-library';
import { Button, CardToggle, defaultRadius, defaultXPM, defaultYPM, Input, InputColor, Span, Tooltip, useTheme } from '@gadeoli/rjs-component-library-themed';
import { 
    // addDrawingCommand, 
    defaultLabels, 
    renderDrawingsLayer 
} from './utils/helpers';
import useEditorEngine from './hooks/useEditorEngine';
import { EditorState } from './hooks/useEditorEngine.types';
// import { strokes } from './utils/mockCommands';
import { MODES } from './hooks/useActionSettings';
import { DRAW_TOOLS } from './hooks/useDrawSettings';
import { transparentize } from 'polished';

const initialState: EditorState = {
    backgroundImage: null,
    objects: [],
    selectedObjectIds: []
};

const CanvasEditor: FC<DefaultProps> = ({
    type='image-editor',
    backgroundSrc,
    labels=defaultLabels,
    height='500px',
    loading,
    className,
    style,

    onCancel,
    onSaveToImage,
}) => {
    const { theme } = useTheme();
    const editorEngine = useEditorEngine(initialState);
    const {
        containerRef,
        canvasRefs,
        contexts,
        
        pointer,
        mode,
        canUndo,
        canRedo,
        canReset,
        
        dispatch,
        getState,
        undo,
        redo,
        reset,
        generateEditedImage,
        setEditedImage,

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

    const classNamesCanvasContainer = useMemo(() => handleCssClassnames([
        type === 'image-editor' ? 'layer-size-fixed' : 'layer-size-free'
    ]), [type]);

    const classNamesCanvas = useMemo(() => handleCssClassnames([
        'cl-canvas-layer',
        type === 'image-editor' ? 'layer-size-fixed' : 'layer-size-free'
    ]), [type]);

    //state
    const [showSubActions, setShowSubActions] = useState(false);
    //state - end

    useEffect(() => {
        //test
        //dispatch(addDrawingCommand(strokes[0]))
    }, [dispatch]);

    useEffect(() => {
        const ctx = contexts.drawings;
        if (!ctx) return;
        renderDrawingsLayer(getState(), ctx);
    }, [getState])

    useEffect(() => {
        if(backgroundSrc){
            setEditedImage(backgroundSrc);
        }
    }, [backgroundSrc])

    return <Container theme={theme} className={classNames} style={style}>
        <ActionConteiner theme={theme}>
            <ActionBlock>
                <ActionButton
                    settings={editorEngine}
                    action={{
                        mode: MODES.DRAW,
                        drawTool: DRAW_TOOLS.PEN
                    }}
                    label={labels.pen}
                    defaultIcon='&#9998;'
                />
                <ActionButton
                    settings={editorEngine}
                    action={{
                        mode: MODES.DRAW,
                        drawTool: DRAW_TOOLS.ERASER
                    }}
                    label={labels.eraser}
                    defaultIcon='&#x232B;'
                />
                <ActionToggle label={labels.shapes}>
                    <CardToggleContainer theme={theme}>
                        <ActionButton
                            settings={editorEngine}
                            action={{
                                mode: MODES.DRAW,
                                drawTool: DRAW_TOOLS.LINE
                            }}
                            label={labels.line}
                            defaultIcon='&#9475;'
                        />
                        <ActionButton
                            settings={editorEngine}
                            action={{
                                mode: MODES.DRAW,
                                drawTool: DRAW_TOOLS.ARROW
                            }}
                            label={labels.arrow}
                            defaultIcon='&#11016;'
                        />
                        <ActionButton
                            settings={editorEngine}
                            action={{
                                mode: MODES.DRAW,
                                drawTool: DRAW_TOOLS.CIRCLE
                            }}
                            label={labels.circle}
                            defaultIcon='&#9711;'
                        />
                    </CardToggleContainer>            
                </ActionToggle>
                <ActionButton
                    settings={editorEngine}
                    onClick={() => setShowSubActions(!showSubActions)}
                    label={labels.settings}
                    defaultIcon=' &#9881;'
                />   
                <ActionButton
                    settings={editorEngine}
                    onClick={() => reset()}
                    label={labels.restore}
                    defaultIcon='&#8634;'
                    disabled={!canReset}
                />
                <ActionButton
                    settings={editorEngine}
                    onClick={() => undo()}
                    label={labels.undo}
                    defaultIcon='&#8630;'
                    disabled={!canUndo}
                />
                <ActionButton
                    settings={editorEngine}
                    onClick={() => redo()}
                    label={labels.redo}
                    defaultIcon='&#8631;'
                    disabled={!canRedo}
                />           
            </ActionBlock>
            <ActionBlock style={{justifyContent: 'flex-end'}}>
                <ActionButton
                    settings={editorEngine}
                    onClick={ async (e: any) => {
                        const editedSrc = await generateEditedImage();
                        onSaveToImage({src: editedSrc, e});
                    }}
                    label={labels.save}
                    defaultIcon='&#128190;'
                    tooltipPos='left'
                />
                <ActionButton
                    settings={editorEngine}
                    onClick={() => {
                        if(onCancel) onCancel();
                    }}
                    label={labels.cancel}
                    defaultIcon='&#215;'
                    tooltipPos='left'
                />
            </ActionBlock>
            {/* let index > that canvas indexes */}
            <SubActionContainer theme={theme} $index={5} $show={showSubActions}> 
                <Button type='clean' className='sub-action-minimaze' onClick={() => setShowSubActions(false)}>
                    &#128469;
                </Button>
                {   
                    mode === 'draw' ? (<ActionDrawOptions editorEngine={editorEngine} labels={labels}/>) :
                    ('')
                }
            </SubActionContainer>
        </ActionConteiner>

        <CanvasContainer className={classNamesCanvasContainer} ref={containerRef} theme={theme}>
            <Canvas 
                ref={canvasRefs.background} 
                $height={height}
                $index={1} 
                className={`${classNamesCanvas} layer-bg`}

                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerOut={handlePointerOut}
                onPointerEnter={handlePointerEnter}

                style={{
                    cursor: pointer
                }}
            />
            <Canvas ref={canvasRefs.drawings} $height={height} $index={2} className={`${classNamesCanvas} layer-drawings layer-editor`}/>
            <Canvas ref={canvasRefs.texts} $height={height} $index={3} className={`${classNamesCanvas} layer-texts layer-editor`}/>
            <Canvas ref={canvasRefs.interactions} $height={height} $index={4} className={`${classNamesCanvas} layer-inters layer-editor`}/>
        </CanvasContainer>
    </Container>;
}

export default CanvasEditor;

const ActionButton = ({
    onClick,
    settings, 
    action, 
    label, 
    defaultIcon,
    disabled,
    tooltipPos='bottom',
} : {
    onClick?: MouseEventHandler<HTMLButtonElement>, 
    settings: any, 
    action?: any, 
    label: LabelProps, 
    defaultIcon: string,
    disabled?: boolean,
    tooltipPos?: 'top' | 'bottom' | 'left' | 'right'
}) => {
    const { theme } = useTheme();
    
    const {
        mode,
        setMode,

        drawTool,
        setDrawTool
    } = settings;

    const isActive = useMemo(() => {
        if(action && action.mode && action.drawTool){
            if(
                (action.mode && mode === action.mode) &&
                (action.drawTool && drawTool === action.drawTool)
            ){
                return true;
            }
        }else{
            return false;
        }
    }, [mode, drawTool]);

    const classNames = useMemo(() => {
        return `${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`
    }, [isActive, disabled]);
    
    return <ActionButtonStyled 
        theme={theme}
        className={classNames} 
        type='button'
        onClick={(e) => {
            if(action && action.mode) setMode(action.mode);
            if(action && action.drawTool) setDrawTool(action.drawTool);
            if(onClick) onClick(e);
        }}
        disabled={disabled}
    >
        <Tooltip
            tipcontent={<Span>{label.txt}</Span>}
            position={tooltipPos}
        >
            <ActionButtonIcon className={classNames} theme={theme}>
                {label.icon ? (<i className={label.icon}/>) : defaultIcon}
            </ActionButtonIcon>
        </Tooltip>
    </ActionButtonStyled>
}

const ActionToggle = ({label, children} : {label: LabelProps, children: any}) => {
    const {theme} = useTheme();

    return (<ActionButtonMimicStyled theme={theme}>
        <CardToggle
            toggleTrigger={(trigger: any) => {
                return (<CardToggleActions onClick={() => trigger()}>
                    <Tooltip
                        tipcontent={<Span>{label.txt}</Span>}
                        position='top'
                    >
                        <ActionButtonIcon theme={theme}>{label.icon ? (<i className={label.icon}/>) : <>&#x2621;</>}</ActionButtonIcon>
                    </Tooltip>
                </CardToggleActions>)
            }}
        >
            {children}
        </CardToggle>
    </ActionButtonMimicStyled>)
}

const ActionDrawOptions: FC<{
    editorEngine: any, 
    labels: TranslationsProps
}> = ({editorEngine, labels}) => {
    const {
        drawPallete,
        setDrawPallete
    } = editorEngine;

    return <SubAction>
        <InputColor 
            name="draw-color"
            onChange={(e: any) => setDrawPallete({color: e.target.value})}
            value={drawPallete.color} 
            style={{marginRight: '0.25rem'}}
        />
        <Input
            name={'line_width'}
            type='number'
            onChange={(e: any) => setDrawPallete({brushSize: Number(e.target.value)})}
            value={drawPallete.brushSize}
            min={2}
            max={100}
            style={{marginRight: '0.5rem'}}
        />
    </SubAction>;
}

const Container = styled.div`
    box-sizing: border-box;
    width: 100%;
    border: 1px solid ${props => props.theme.border};
    border-radius: ${defaultRadius};

    &.hidden-editor{
        display: none;
    }
`;

const ActionConteiner = styled.div`
    position: relative;
    background-color: ${props => props.theme.background};
    border-bottom: 2px solid ${props => props.theme.border};
    width: 100%;
    box-sizing: border-box;
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
`;

const ActionBlock = styled.div`
    background-color: ${props => props.theme.background};
    padding: ${defaultXPM} ${defaultYPM};
    box-sizing: border-box;
    display: flex;
    width: 50%;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
`;

const CardToggleContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    min-width: 200px;
    max-width: 350px;
    padding: ${defaultXPM} ${defaultYPM};
    background-color: ${props => props.theme.background};
    border: 1px solid ${props => props.theme.border};
    border-radius: ${defaultRadius};
    z-index: 1000;
`;

const CardToggleActions = styled.div`

`;

const CanvasContainer = styled.div`
    width: 100%;
    box-sizing: border-box;
    position: relative;
    display: flex;
    justify-content: center;

    &.layer-size-fixed{
        background-size: 40px 40px;
        background-image: radial-gradient(circle, ${props => props.theme.text} 1px, rgba(0, 0, 0, 0) 1px);
    }

    &.layer-size-free{
        background-color: ${props => props.theme.background};
    }
`;

const Canvas = styled.canvas<{$index: number, $height: string}>`
    height: ${props => props.$height};
    width: auto;
    inset: 0;
    z-index: ${props => props.$index * 10};

    &.layer-size-fixed{
        max-width: 70%;
    }

    &.layer-size-free{
        width: 100%;
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

const ActionButtonStyled = styled.button`
    border: 2px solid transparent;
    background: transparent;
    transition: border .2s ease-in-out;
    border-radius: ${defaultRadius};
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-right: 6px;

    &:hover{
        border: 2px solid ${props => props.theme.border} !important;
    }

    &.active{
        border: 2px solid ${props => props.theme.primary};
    }
    
    &.disabled{
        opacity: 0.6;
    }
`

const ActionButtonMimicStyled = styled.div`
    border: 2px solid transparent;
    background: transparent;
    transition: border .2s ease-in-out;
    border-radius: ${defaultRadius};
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-right: 6px;

    &:hover{
        border: 2px solid ${props => props.theme.border} !important;
    }

    &.active{
        border: 2px solid ${props => props.theme.primary};
    }
`

const ActionButtonIcon = styled.span`
    font-size: ${props => props.theme.fontSize.text};
    transition: color .5s ease-in;
    color: ${props => props.theme.text};
    padding: ${defaultXPM} ${defaultYPM};
    font-weight: bold;

    i{
        color: ${props => props.theme.text};
    }
`;

const SubActionContainer = styled.div<{$show: boolean, $index: number}>`
    display: ${props => props.$show ? 'flex' : 'none'};
    justify-content: center;
    position: absolute;
    bottom: -100%;
    left: 0;
    width: 100%;
    z-index: ${props => (props.$index + 1) * 10};
    background-color: ${props => transparentize(0.05, props.theme.background)};
    padding-top: 1rem;

    button.sub-action-minimaze{
        position: absolute;
        top: 0.5rem;
        right: 1rem;
    }
`;

const SubAction = styled.div`
    display: flex;
    align-items: center;
    padding: ${defaultYPM} ${defaultXPM};
`;