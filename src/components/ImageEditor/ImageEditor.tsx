import React, { FC, useEffect, useMemo, useState } from 'react';
import { ImageEditorProps } from './ImageEditor.types';
import { useTheme } from '../ThemeHandler';
import { handleCssClassnames } from '@gadeoli/js-helpers-library';
import styled from 'styled-components';
import { usePhotoEditor } from './useEditor';
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

const ImageEditor: FC<ImageEditorProps> = ({
    src,
    onSaveImage,
    actions = {
        colorEditing: true,
        flip: true,
        rotate: true,
        zoom: true,
        drawing: true,
        text: true,
        write: false
    },
    labels = {
        brightness: {txt: 'Brightness'},
        brushColor: {txt: 'Brush color'},
        brushWidth: {txt: 'Brush width'},
        contrast: {txt: 'Contrast'},
        controls: {txt: 'Controls'},
        draw: {txt: 'Draw'},
        flip: {txt: 'Flip'},
        grayscale: {txt: 'Grayscale'},
        horizontal: {txt: 'Horizontally'},
        pan: {txt: 'Pan'}, //Mover / Arrastar
        reset: {txt: 'Reset'},
        rotate: {txt: 'Rotate'},
        saturate: {txt: 'Saturate'},
        save: {txt: 'Save'},
        vertical: {txt: 'Vertically'},
        zoom: {txt: 'Zoom'},
        write: {txt: 'Write'},
        emptySelect: {txt: 'No options selected'}
    },
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
        canvasRef,
        imageSrc,
        brightness,
        setBrightness,
        contrast,
        setContrast,
        saturate,
        setSaturate,
        grayscale,
        setGrayscale,
        rotate,
        setRotate,
        zoom,
        setZoom,
        action,
        setAction,
        handlePointerDown,
        handlePointerUp,
        handlePointerMove,
        handleWheel,
        resetFilters,
        generateEditedImage,
    } = usePhotoEditorProps;

    const rangeActions = useMemo(() => [
        {name: 'brightness', value: brightness, min: 0, max: 200, step: 1, onChange: (v: number) => setBrightness(v)},
        {name: 'contrast', value: contrast, min: 0, max: 200, step: 1, onChange: (v: number) => setContrast(v)},
        {name: 'saturate', value: saturate, min: 0, max: 200, step: 1, onChange: (v: number) => setSaturate(v)},
        {name: 'grayscale', value: grayscale, min: 0, max: 100, step: 1, onChange: (v: number) => setGrayscale(v)},
        {name: 'rotate', value: rotate, min: 0, max: 360, step: 1, onChange: (v: number) => setRotate(v)},
        {name: 'zoom', value: zoom, min: 0.1, max: 3, step: 0.1, onChange: (v: number) => setZoom(v)}
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
                style={{
                    width: 'auto',
                    height: 'auto',
                    maxHeight: '26rem',
                    maxWidth: '70%',
                    touchAction: 'none',
                }}
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
            />
            <SubActionContainer theme={theme} $show={showSubActions}>
                <Button type='clean' className='sub-action-minimaze' onClick={() => setShowSubActions(false)}>
                    &#128469;
                </Button>
                {   
                    actions.drawing && action === 'draw' ? (<ActionDrawOptions usePhotoEditorProps={usePhotoEditorProps} loading={loading} />) : 
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

                            return (<Action key={k}>
                                <Range
                                    name={ac.name}
                                    min={ac.min}
                                    max={ac.max}
                                    value={ac.value}
                                    onChange={(e: any) => ac.onChange(Number(e.target.value))}
                                    step={ac.step}
                                />
                                <Label>{labels[keyParam].txt}</Label>
                            </Action>)
                        })}
                    </CardContent>
                </Card>
            </CardToggle>

            <Action>
                <Button onClick={() => {
                    resetFilters();
                    setShowSubActions(false);
                }}>
                    &#8635;
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

const ActionDrawOptions: FC<{usePhotoEditorProps: any, loading: boolean | undefined}> = ({usePhotoEditorProps, loading}) => {
    const {
        lineColor,
        setLineColor,
        lineWidth,
        setLineWidth,
        lineStyle,
        setLineStyle,
    } = usePhotoEditorProps;

    return <SubAction>
        <InputColor 
            name="draw-color"
            onChange={(e: any) => setLineColor(e.target.value)} 
            value={lineColor} 
            style={{marginRight: '0.25rem'}}
        />
        <Input 
            name={'line_width'}
            type='number'
            onChange={(e: any) => setLineWidth(Number(e.target.value))}
            value={lineWidth}
            min={2}
            max={100}
        />
        {/* Not implement */}
        {/* {<Checkbox
            name='line-style'
            type='primary' 
            checkedValue={'hand-free'}
            uncheckedValue={'straight'}
            value={lineStyle}
            onChange={(v: any) => setLineStyle(v)}
            disabled={loading}
            text={<>&#9997;</>}
            checkedIcon={true}
            style={{marginLeft: '0.5rem'}}
        />} */}
    </SubAction>;
}

const ActionWriteOptions: FC<{usePhotoEditorProps: any, loading: boolean | undefined, labels: any}> = ({usePhotoEditorProps, loading, labels}) => {
    const {
        textColor,
        setTextColor,
        textFont,
        setTextFont,
        textFontSize,
        setTextFontSize
    } = usePhotoEditorProps;

    const [fonts, setFonts] = useState<{key: string, value: string, selected: boolean | undefined}[]>([
        {key: 'Arial', value: 'Arial'},
        {key: 'Times New Roman', value: 'Times New Roman'},
        {key: 'Verdana', value: 'Verdana'},
        {key: 'Georgia', value: 'Georgia'},
        {key: 'Courier New', value: 'Courier New'},
    ].map(f => ({
        ...f,
        selected: f.key === textFont
    })));

    return <SubAction>
        <InputColor 
            name="draw-color"
            onChange={(e: any) => setTextColor(e.target.value)} 
            value={textColor} 
            style={{marginRight: '0.25rem'}}
        />
        <Input 
            name={'line_width'}
            type='number'
            onChange={(e: any) => setTextFontSize(Number(e.target.value))}
            value={textFontSize}
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
                setTextFont(selected)
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
`;

const Canvas = styled.canvas`

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