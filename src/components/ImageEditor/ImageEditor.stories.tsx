import React, { useEffect, useState, ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import ImageEditor from './ImageEditor';

type StoryProps = ComponentProps<typeof ImageEditor> & {
    testSrcUrl: string | null | undefined;
};

const meta: Meta<StoryProps> = {
    component: ImageEditor,
    title: "RjsComponentLibraryThemed/ImageEditor",
};

export default meta;

type Story = StoryObj<StoryProps>;

export const Default: Story = {
    args: {
        testSrcUrl: "",
        onSaveImage: ({src, e}) => console.log({src, e}),
        loading: false,
        className: "",

        style: {}
        /*
        actions: {
            colorEditing: true,
            flip: true,
            rotate: true,
            zoom: true,
            drawing: true,
        },
        labels = {
            ...
        }
        */,

        src: ''
    },
    argTypes: {
        testSrcUrl: {
            type: {name: 'string', required: false},
        },
        src: {
            description: 'img src'
        },
        onSaveImage: {
            description: 'function to run on onchange event. this will recieve the event'
        },
        actions: {
            table: { type: { summary: 'any'} },
            defaultValue: {
                colorEditing: true,
                flip: true,
                rotate: true,
                zoom: true,
                drawing: true,
            },
            description: 'Config which actions will be active. All actions are active by default'
        },
        labels: {
            table: { type: { summary: 'any'} },
            defaultValue: {
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
                write: {txt: 'Write'}
            },
            description: 'Labels for buttons, actions'
        },
        loading: {
            type: {name: 'boolean', required: false},
            defaultValue: false,
            description: 'Loading effect, if true add a class: loading-effect to component'
        },
        className: {
            type: {name: 'string', required: false},
            defaultValue: '',
            description: 'full;'
        },
        style: {
            table: { type: { summary: 'any'} },
            defaultValue: null,
            description: 'custom styles. This field is not required'
        }    
    },
    render: ({testSrcUrl, ...args}) => {
        const [src, setSrc] = useState<string | undefined>('');
        const [savedSrc, setSavedSrc] = useState<string | undefined>('');

        const handleFetchImage = async (url: string) => {
            try {
                const response = await fetch(url);

                if (!response.ok) throw new Error('Failed to fetch image');

                const blob = await response.blob();
                const imageObjectUrl = URL.createObjectURL(blob);
                
                setSrc(imageObjectUrl);
            } catch (err) {
                console.error(err);
                alert('Error fetching image.');
            }
        };

        useEffect(() => {
            if(testSrcUrl){
                handleFetchImage(testSrcUrl);
            }
        }, [testSrcUrl]);

        return (<div>
            <input  type="file" 
                    multiple={false}
                    style={{marginBottom: '20px'}} 
                    onChange={(e: any) => {
                if (e.target.files && e.target.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        if(reader.result instanceof ArrayBuffer){
                            setSrc(new TextDecoder().decode(reader.result));
                        }else{
                            setSrc(reader.result ? reader.result : '');
                        }
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            }}/>

            <ImageEditor {...{...args, src}} onSaveImage={(props : any) => setSavedSrc(props.src)}/>

            <img src={savedSrc} alt='saved img - preview' style={{width: '300px', marginTop: '40px'}}/>
        </div>)
    }
};