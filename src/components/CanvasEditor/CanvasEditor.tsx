import React, { FC, MouseEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { DefaultProps, LabelProps, TranslationsProps } from './CanvasEditor.types';
import { handleCssClassnames } from '@gadeoli/js-helpers-library';
import { Button, CardToggle, defaultRadius, defaultXPM, defaultYPM, Input, InputColor, Label, Range, Span, Tooltip, useTheme } from '@gadeoli/rjs-component-library-themed';
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
import { useElementSize, useGhostInFirstRender } from '@gadeoli/rjs-hooks-library';

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
    const editorEngine = useEditorEngine(
        initialState, 
        {
            fixCssWidth: type === 'image-editor' ? 0.8 : 1
        }
    );
    const {
        containerRef,
        canvasRefs,
        contexts,
        
        pointer,
        mode,
        canUndo,
        canRedo,
        canReset,
        filters,
        scales,
        
        dispatch,
        getState,
        undo,
        redo,
        reset,
        setFilters,
        setScales,        
        generateEditedImage,
        setEditedImage,
        
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerOut,
        handlePointerEnter,
        handleWheel
    } = editorEngine;
    const containerVisible = useGhostInFirstRender();
    const actionContainerRef = useRef(null);
    const actionContainerSize = useElementSize(actionContainerRef);

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

    return <Container theme={theme} className={classNames} style={style} $visible={containerVisible}>
        <ActionConteiner theme={theme} ref={actionContainerRef}>
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
                <ActionToggle label={labels.shapes} defaultIcon='&#x2621;'>
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
                
                <ActionPipe theme={theme}><SmallPipe theme={theme}/></ActionPipe>

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

                <ActionPipe theme={theme}><SmallPipe theme={theme}/></ActionPipe>

                <ActionToggle label={labels.filters} defaultIcon='&#9929;'>
                    <CardToggleContainer theme={theme}>
                        <ActionSlider
                            name='brightness'
                            value={filters.brightness}
                            min={0}
                            max={200}
                            step={1}
                            label={labels.brightness}
                            onChange={(value: number) => {setFilters({brightness: value})}}
                        />
                        <ActionSlider
                            name='contrast'
                            value={filters.contrast}
                            min={0}
                            max={200}
                            step={1}
                            label={labels.contrast}
                            onChange={(value: number) => {setFilters({contrast: value})}}
                        />
                        <ActionSlider
                            name='saturate'
                            value={filters.saturate}
                            min={0}
                            max={200}
                            step={1}
                            label={labels.saturate}
                            onChange={(value: number) => {setFilters({saturate: value})}}
                        />
                        <ActionSlider
                            name='grayscale'
                            value={filters.grayscale}
                            min={0}
                            max={100}
                            step={1}
                            label={labels.grayscale}
                            onChange={(value: number) => {setFilters({grayscale: value})}}
                        />
                        <ActionSlider
                            name='rotate'
                            value={scales.rotate}
                            min={0}
                            max={360}
                            step={1}
                            label={labels.rotate}
                            onChange={(value: number) => {setScales({rotate: value})}}
                        />
                        <ActionSlider
                            name='zoom'
                            value={scales.zoom}
                            min={0.1}
                            max={3}
                            step={0.1}
                            label={labels.zoom}
                            onChange={(value: number) => {setScales({zoom: value})}}
                        />
                    </CardToggleContainer>        
                </ActionToggle>   

                <ActionButton
                    settings={editorEngine}
                    action={{
                        mode: MODES.PAN,
                    }}
                    label={labels.pan_zoom}
                    defaultIcon='P'
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
                    defaultIcon='&#x2713;'
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
            <SubActionContainer theme={theme} $index={5} $show={showSubActions} $position={actionContainerSize}> 
                <Button type='clean' className='sub-action-minimaze' onClick={() => setShowSubActions(false)}>
                    &#128469;
                </Button>
                {   
                    mode === 'draw' ? (<ActionDrawOptions editorEngine={editorEngine} labels={labels}/>) :
                    ('')
                }
            </SubActionContainer>
        </ActionConteiner>

        <CanvasContainer className={classNamesCanvasContainer} ref={containerRef} theme={theme} $height={height}>
            <Canvas 
                ref={canvasRefs.background} 
                $index={1} 
                className={`${classNamesCanvas} layer-bg`}
                theme={theme}

                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerOut={handlePointerOut}
                onPointerEnter={handlePointerEnter}
                onWheel={handleWheel}

                style={{
                    cursor: pointer
                }}
            />
            <Canvas ref={canvasRefs.drawings} $height={height} $index={2} theme={theme} className={`${classNamesCanvas} layer-drawings layer-editor`}/>
            <Canvas ref={canvasRefs.texts} $height={height} $index={3} theme={theme} className={`${classNamesCanvas} layer-texts layer-editor`}/>
            <Canvas ref={canvasRefs.interactions} $height={height} $index={4} theme={theme} className={`${classNamesCanvas} layer-inters layer-editor`}/>
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
        }else if(action && action.mode && mode === action.mode){
            return true;
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

const ActionToggle = ({label, children, defaultIcon} : {label: LabelProps, children: any, defaultIcon: string}) => {
    const {theme} = useTheme();

    return (<ActionButtonMimicStyled theme={theme}>
        <CardToggle
            xOverride='left'
            yOverride='bottom'
            toggleTrigger={(trigger: any) => {
                return (<CardToggleActions onClick={() => trigger()}>
                    <Tooltip
                        tipcontent={<Span>{label.txt}</Span>}
                        position='top'
                    >
                        <ActionButtonIcon theme={theme}>{label.icon ? (<i className={label.icon}/>) : <>{defaultIcon}</>}</ActionButtonIcon>
                    </Tooltip>
                </CardToggleActions>)
            }}
        >
            {children}
        </CardToggle>
    </ActionButtonMimicStyled>)
}

const ActionSlider = ({
    name,
    value,
    min,
    max,
    step,
    label,
    onChange
} : {
    name : string,
    value: number,
    min: number,
    max: number,
    step: number,
    label: LabelProps,
    onChange: (value: number) => void
}) => {
    return (<SlideAction style={{display: 'flex'}}>               
        <SlideActionLabelContainer>
            <Label>{label.txt}</Label>
            <Range
                name={name + '_input_slider'}
                min={min}
                max={max}
                value={value}
                onChange={(e: any) => onChange(Number(e.target.value))}
                step={step}
            />
        </SlideActionLabelContainer>
        <Input 
                name={name}
                min={min}
                max={max}
                type='number'
                value={value}
                onChange={(e: any) => onChange(Number(e.target.value))}
                style={{
                    marginLeft: '4px',
                }}
            />
    </SlideAction>)
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

const Container = styled.div<{$visible: boolean}>`
    box-sizing: border-box;
    width: 100%;
    border: 1px solid ${props => props.theme.border};
    border-radius: ${defaultRadius};

    &.hidden-editor{
        display: ${props => props.$visible ? 'none' : 'block'};
        opacity: ${props => props.$visible ? 0 : 1};
        pointer-events: ${props => props.$visible ? 'none' : 'auto'};
        transition: opacity 0.3s ease;
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
    align-items: flex-start;
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

const CanvasContainer = styled.div<{$height: string}>`
    width: 100%;
    height: ${props => props.$height};
    box-sizing: border-box;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;

    &.layer-size-fixed{
        background-size: 40px 40px;
        background-image: radial-gradient(circle, ${props => props.theme.border} 1px, rgba(0, 0, 0, 0) 1px);
    }

    &.layer-size-free{
        background-color: ${props => props.theme.background};
    }
`;

const Canvas = styled.canvas<{$index: number}>`
    height: 100%;
    width: auto;
    inset: 0;
    z-index: ${props => props.$index * 10};
    border: 1px solid ${props => props.theme.border};

    &.layer-size-fixed{
        max-width: 80%;
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

    &:last-child{
        margin-right: unset;
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

const SubActionContainer = styled.div<{$show: boolean, $index: number, $position: any}>`
    display: ${props => props.$show ? 'flex' : 'none'};
    justify-content: center;
    position: absolute;
    bottom: ${props => props.$position && props.$position.height > 1 ? `unset` : '-100%'};
    top: ${props => props.$position ? `${props.$position.height}px` : 'unset'};
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

const ActionPipe = styled.div`
    display: block;
    height: 2rem;
    margin: 0 ${defaultXPM};
    display: flex;
    align-items: center;
`;

const SmallPipe = styled.div`
    display: block;
    height: 15px;
    width: 1px;
    background-color: ${props => props.theme.border};
`;

const SlideAction = styled.div`
    margin-bottom: 0.5rem;
    margin-right: 1rem;
    position: relative;

    .cl-themed__radio-multi{
        flex-wrap: wrap;
        max-height: 5rem;
    }
`;

const SlideActionLabelContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
`;