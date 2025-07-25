import React, { FC, useEffect, useMemo, useState } from 'react';
import { DefaultProps, TranslationsProps } from './ImageEditor.types';
import { useTheme } from '../ThemeHandler';
import { handleCssClassnames } from '@gadeoli/js-helpers-library';
import styled from 'styled-components';
import usePhotoEditor from './usePhotoEditor';
import { transparentize } from 'polished';
import { 
    Container,
    Range, 
    Checkbox,
    Input,
    Button,
    RadioMulti,
    Label,
    CardToggle,
    Card,
    CardContent,
    InputColor,
    Select,
    defaultRadius,
    defaultXPM,
    defaultYPM
} from '@gadeoli/rjs-component-library-themed';
import { labels as defaultLabels, FILTERS } from './helpers';

const ImageEditor: FC<DefaultProps> = ({
    src,
    onSaveImage,
    actions = {
        colorEditing: true,
        flip: true,
        rotate: true,
        zoom: true,
        drawing: true,
        text: true,
        write: true
    },
    labels = defaultLabels,
    loading,
    className,
    style
}) => {
    const {theme} = useTheme();

    const classNames = handleCssClassnames([
        'cl-image__editor',
        loading ? 'loading-effect' : undefined,
        className
    ]);

    const usePhotoEditorProps = usePhotoEditor({ src });
    const {
        //General
        imageCanvasRef,
        editorCanvasRef,
        imageSrc,
        action,
        cursor,
        canRedo,
        canUndo,
        canUnPanning,

        //Filters
        brightness,
        contrast,
        saturate,
        grayscale,
        rotate,
        zoom,
        
        //Setters
        //General
        setAction,
        generateEditedImage,
        resetEditor,
        resetPanning,

        //Filters
        setFilterValue,

        //Handlers
        handlePointerDown,
        handlePointerUp,
        handlePointerOut,
        handlePointerEnter,
        handlePointerMove,
        handleClick,
        handleDoubleClick,
        handleWheel,
        handleRedo,
        handleUndo,
    } = usePhotoEditorProps;

    const rangeActions = useMemo(() => [
        {name: 'brightness', value: brightness, min: 0, max: 200, step: 1, onChange: (v: number) => setFilterValue(v, FILTERS.BRIGHTNESS)},
        {name: 'contrast', value: contrast, min: 0, max: 200, step: 1, onChange: (v: number) => setFilterValue(v, FILTERS.CONTRAST)},
        {name: 'saturate', value: saturate, min: 0, max: 200, step: 1, onChange: (v: number) => setFilterValue(v, FILTERS.SATURATE)},
        {name: 'grayscale', value: grayscale, min: 0, max: 100, step: 1, onChange: (v: number) => setFilterValue(v, FILTERS.GRAYSCALE)},
        {name: 'rotate', value: rotate, min: 0, max: 360, step: 1, onChange: (v: number) => setFilterValue(v, FILTERS.ROTATE)},
        {name: 'zoom', value: zoom, min: 0.1, max: 3, step: 0.1, onChange: (v: number) => setFilterValue(v, FILTERS.ZOOM)},
    ], [
        brightness,
        contrast,
        saturate,
        grayscale,
        rotate,
        zoom
    ]);

    //state
    const [radioActionValues, setRadioActionValues] = useState<{key: string, value: string}[]>([]);
    const [showSubActions, setShowSubActions] = useState(false);
    //state - end

    const handleSubActionContainer = ({selAction} : {selAction: string;}) => {
        const actionsWithSub = ['draw', 'flip', 'write'];

        if(!actionsWithSub.includes(selAction) || (action === selAction && showSubActions)){
            setShowSubActions(false);
        }else{
            setShowSubActions(true);
        }
    }

    const handleCanvasActions = () => {
        const aux = [];

        if(actions.drawing){
            aux.push({key: 'draw', value: labels['draw'].txt});
        }

        if(actions.flip){
            aux.push({key: 'flip', value: labels['flip'].txt});
        }

        if(actions.write){
            aux.push({key: 'write', value: labels['write'].txt})
        }

        if(actions.zoom){
            aux.push({key: 'pan', value: labels['pan'].txt})
        }

        setRadioActionValues(aux);
    }

    useEffect(() => {
        handleCanvasActions();
    }, []);

    return (<Container type='clean' className={classNames} style={style}>
        {imageSrc && (<CanvasContainer>
            <Canvas
                ref={imageCanvasRef}

                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerOut={handlePointerOut}
                onPointerEnter={handlePointerEnter}
                
                onWheel={handleWheel}

                onClick={(e) => {
                    handleClick(e);
                    setShowSubActions(false);
                }}
                onDoubleClick={handleDoubleClick}

                style={{
                    cursor: cursor
                }}
            />
            <Canvas
                ref={editorCanvasRef}
                className='layer-editor'
            />
            <SubActionContainer theme={theme} $show={showSubActions}>
                <Button type='clean' className='sub-action-minimaze' onClick={() => setShowSubActions(false)}>
                    &#128469;
                </Button>
                {   
                    actions.drawing && action === 'draw' ? (<ActionDrawOptions usePhotoEditorProps={usePhotoEditorProps} loading={loading} labels={labels}/>) : 
                    actions.write && action === 'write' ? (<ActionWriteOptions usePhotoEditorProps={usePhotoEditorProps} loading={loading} labels={labels} />) : 
                    actions.flip && action === 'flip' ? (<ActionFlipOptions usePhotoEditorProps={usePhotoEditorProps} loading={loading} labels={labels}/>) : 
                    ('')
                }
            </SubActionContainer>
        </CanvasContainer>)}

        {imageSrc && (<Controls theme={theme}>
            <Action>
                <Button style={{fontSize: '70%'}} onClick={ async (e: any) => {
                    // onSaveImage({src: imageSrc, e})
                    const editedSrc = await generateEditedImage();
                    onSaveImage({src: editedSrc, e});
                }}>
                    &#10003;
                </Button>
            </Action>  

            <CardToggle
                className='' 
                yOverride='top'
                xOverride='left'
                toggleTrigger={(trigger: any) => (<Action>
                    <Button onClick={() => trigger()}>&equiv;</Button>
                </Action>)} 
            >
                <Card>
                    <CardContent>
                        {rangeActions.map((ac, k) => {
                            const keyParam = ac.name as keyof typeof labels;

                            return (<Action key={k} style={{display: 'flex'}}>
                                
                                <ActionLabelContainer>
                                    <Label>{labels[keyParam].txt}</Label>
                                    <Range
                                        name={ac.name + '_input_slider'}
                                        min={ac.min}
                                        max={ac.max}
                                        value={ac.value}
                                        onChange={(e: any) => ac.onChange(Number(e.target.value))}
                                        step={ac.step}
                                    />
                                </ActionLabelContainer>
                                <Input 
                                        name={ac.name}
                                        min={ac.min}
                                        max={ac.max}
                                        type='number'
                                        value={ac.value}
                                        onChange={(e: any) => ac.onChange(Number(e.target.value))}
                                        style={{
                                            marginLeft: '4px',
                                        }}
                                    />
                            </Action>)
                        })}
                    </CardContent>
                </Card>
            </CardToggle>

            <Action>
                <Button onClick={() => {
                    resetEditor();
                    setShowSubActions(false);
                }}>
                    &#8635;
                </Button>
            </Action>

            <Action>
                <Button disabled={!canUndo} onClick={() => {
                    handleUndo();
                    setShowSubActions(false);
                }}>
                    &#8630;
                </Button>
            </Action>

            <Action>
                <Button disabled={!canRedo} onClick={() => {
                    handleRedo();
                    setShowSubActions(false);
                }}>
                    &#8631;
                </Button>
            </Action> 

            <Action>
                <Button disabled={!canUnPanning} onClick={() => {
                    resetPanning();
                }}>
                    &#9635;
                </Button>
            </Action>              
            
            <Action>
                <RadioMulti
                    type='primary'
                    selectedValue={action}
                    values={radioActionValues}
                    onChange={(sel: any) => {
                        setAction(sel.key);
                        handleSubActionContainer({selAction: sel.key});
                    }}
                    selectedIcon={true}
                    style={{marginRight: '.75rem'}}
                />
            </Action>
        </Controls>)}
    </Container>);
}

export default ImageEditor;

const ActionDrawOptions: FC<{
    usePhotoEditorProps: any, 
    loading: boolean | undefined, 
    labels: TranslationsProps
}> = ({usePhotoEditorProps, loading, labels}) => {
    const {
        drawTool,
        drawColor,
        brushSize,

        setDrawTool,
        setDrawColor,
        setBrushSize
    } = usePhotoEditorProps;

    const [drawTools, setDrawTools] = useState<{key: string, value: string, selected: boolean | undefined}[]>([
        {key: 'pen', value: labels.pen.txt},
        {key: 'line', value: labels.line.txt},
        {key: 'circle', value: labels.circle.txt},
        {key: 'arrow', value: labels.arrow.txt},
        {key: 'eraser', value: labels.eraser.txt}
    ].map(f => ({
        ...f,
        selected: f.key === drawTool
    })));

    return <SubAction>
        <InputColor 
            name="draw-color"
            onChange={(e: any) => setDrawColor(e.target.value)}
            value={drawColor} 
            style={{marginRight: '0.25rem'}}
        />
        <Input 
            name={'line_width'}
            type='number'
            onChange={(e: any) => setBrushSize(Number(e.target.value))}
            value={brushSize}
            min={2}
            max={100}
            style={{marginRight: '0.5rem'}}
        />
        <Select
            name="draw-tool"
            className="full"
            emptyText={labels.emptySelect.txt} 
            values={drawTools} 
            handleValues={({selected, values}) => {
                setDrawTools(values);
                setDrawTool(selected)
            }}
            handleSelect={(s) => {
                // console.log(s)
            }}
            inlineDrawer={true}
            toggleY='top'
        />
    </SubAction>;
}

const ActionWriteOptions: FC<{usePhotoEditorProps: any, loading: boolean | undefined, labels: any}> = ({usePhotoEditorProps, loading, labels}) => {
    const {
        writeText,
        writeFontFamily,
        writeFontSize,
        writeColor,
        writeRotation,
        writeScale,

        setWriteText,
        setWriteFontFamily,
        setWriteFontSize,
        setWriteColor,
        setWriteRotation,
        setWriteScale,
    } = usePhotoEditorProps;

    const [fonts, setFonts] = useState<{key: string, value: string, selected: boolean | undefined}[]>([
        {key: 'Arial', value: 'Arial'},
        {key: 'Times New Roman', value: 'Times New Roman'},
        {key: 'Verdana', value: 'Verdana'},
        {key: 'Georgia', value: 'Georgia'},
        {key: 'Courier New', value: 'Courier New'},
    ].map(f => ({
        ...f,
        selected: f.key === writeFontFamily
    })));

    return <SubAction>
        <InputColor 
            name="draw-color"
            onChange={(e: any) => setWriteColor(e.target.value)} 
            value={writeColor} 
            style={{marginRight: '0.25rem'}}
        />
        <Input 
            name={'line_width'}
            type='number'
            onChange={(e: any) => setWriteFontSize(Number(e.target.value))}
            value={writeFontSize}
            min={2}
            max={100}
            style={{marginRight: '0.25rem'}}
        />
        <Select
            name="text-font"
            className="full"
            emptyText={labels.emptySelect.txt} 
            values={fonts} 
            handleValues={({selected, values}) => {
                setFonts(values);
                setWriteFontFamily(selected)
            }}
            handleSelect={(s) => {
                // console.log(s)
            }}
            inlineDrawer={true}
        />
    </SubAction>;
}

const ActionFlipOptions: FC<{usePhotoEditorProps: any, loading: boolean | undefined, labels: any}> = ({usePhotoEditorProps, loading, labels}) => {
    const {
        flipHorizontal,
        setFlipHorizontal,
        flipVertical,
        setFlipVertical
    } = usePhotoEditorProps;

    return <SubAction>
        <SiblingsActions>
            <Action>
                <Checkbox
                    name='flipHorizontal'
                    type='primary' 
                    checkedValue={true}
                    uncheckedValue={false}
                    value={flipHorizontal}
                    onChange={(v: boolean) => setFlipHorizontal(v)}
                    disabled={loading}
                    text={labels.horizontal.txt}
                    checkedIcon={true}
                />
            </Action>
            <Action>
                <Checkbox
                    name='flipVertical'
                    type='primary' 
                    checkedValue={true}
                    uncheckedValue={false}
                    value={flipVertical}
                    onChange={(v: boolean) => setFlipVertical(v)}
                    disabled={loading}
                    text={labels.vertical.txt}
                    checkedIcon={true}
                />
            </Action>
        </SiblingsActions>
    </SubAction>;
}

const CanvasContainer = styled.div`
    background-color: ${props => props.theme.background};
    box-sizing: border-box;
    position: relative;
    display: flex;
    justify-content: center;
    position: relative;
`;

const Canvas = styled.canvas`
    width: auto;
    height: auto;
    max-height: 26rem;
    max-width: 70%;

    &.layer-editor{
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
    }
`;

const Controls = styled.div`
    width: 100%;
    padding-top: ${defaultYPM};
    padding-bottom: ${defaultYPM};
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    border-bottom-left-radius: ${defaultRadius};
    border-bottom-right-radius: ${defaultRadius};
    background-color: ${props => props.theme.background};
`;

const SiblingsActions = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 0.25rem;
`;

const SubActionContainer = styled.div<{$show: boolean}>`
    display: ${props => props.$show ? 'flex' : 'none'};
    justify-content: center;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: ${props => transparentize(0.2, props.theme.background)};
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

const Action = styled.div`
    margin-bottom: 0.5rem;
    margin-right: 1rem;
    position: relative;

    .cl-themed__radio-multi{
        flex-wrap: wrap;
        max-height: 5rem;
    }
`;

const ActionLabelContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
`;