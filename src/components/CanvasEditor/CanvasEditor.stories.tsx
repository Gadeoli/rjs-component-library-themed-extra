import React, { useEffect, useState, ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import CanvasEditor from './CanvasEditor';
import styled from "styled-components";

type StoryProps = ComponentProps<typeof CanvasEditor> & {
    testSrcUrl: string | null | undefined;
};

const meta: Meta<StoryProps> = {
    component: CanvasEditor,
    title: "RjsComponentLibraryThemed/CanvasEditor",
};

export default meta;

type Story = StoryObj<StoryProps>;

export const DefaultImageEditor: Story = {
    args: {
        testSrcUrl: "",
        onSaveToImage: ({src, e}) => console.log({src, e}),
        onCancel: () => console.log('cancel clicked'),
        loading: false,
        className: "",

        style: {}
        /*
        labels = {
            ...
        }
        */,

        backgroundSrc: ''
    },
    argTypes: {
        testSrcUrl: {
            type: {name: 'string', required: false},
        },
        backgroundSrc: {
            description: 'img src'
        },
        onSaveToImage: {
            description: 'function to run on onchange event. this will recieve the event'
        },
        labels: {
            
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
        const [bgSource, setBgSrc] = useState<string | undefined>('');
        const [savedSrc, setSavedSrc] = useState<string | undefined>('');

        const handleFetchImage = async (url: string) => {
            try {
                const response = await fetch(url);

                if (!response.ok) throw new Error('Failed to fetch image');

                const blob = await response.blob();
                const imageObjectUrl = URL.createObjectURL(blob);
                
                setBgSrc(imageObjectUrl);
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

        return (<Container>
            <input  type="file" 
                    multiple={false}
                    style={{marginBottom: '20px'}} 
                    onChange={(e: any) => {
                if (e.target.files && e.target.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        if(reader.result instanceof ArrayBuffer){
                            setBgSrc(new TextDecoder().decode(reader.result));
                        }else{
                            setBgSrc(reader.result ? reader.result : '');
                        }
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            }}/>

            <CanvasEditor {...{...args, backgroundSrc: bgSource}} onSaveToImage={(props : any) => setSavedSrc(props.src)}/>

            {savedSrc && <img src={savedSrc} alt='saved img - preview' style={{width: '300px', marginTop: '40px'}}/>}
        </Container>)
    }
};

export const DefaultEditor: Story = {
    args: {
        testSrcUrl: "",
        onSaveToImage: ({src, e}) => console.log({src, e}),
        onCancel: () => console.log('cancel clicked'),
        loading: false,
        className: "",
        type: "free-editor",
        style: {}
        /*
        labels = {
            ...
        }
        */,

        backgroundSrc: ''
    },
    argTypes: {
        testSrcUrl: {
            type: {name: 'string', required: false},
        },
        backgroundSrc: {
            description: 'img src'
        },
        onSaveToImage: {
            description: 'function to run on onchange event. this will recieve the event'
        },
        labels: {
            
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
        const [savedSrc, setSavedSrc] = useState<string | undefined>('');

        return (<Container>
            <CanvasEditor 
                {...{...args}} 
                onSaveToImage={(props : any) => setSavedSrc(props.src)}
                // height='500px'
            />

            <div style={{marginTop: '40px'}}>
                <ImgResult src={savedSrc} alt='saved img - preview' style={{width: '300px'}}/>
            </div>
        </Container>)
    }
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
`

const ImgResult = styled.img`
    display: block;
    border: 1px solid #fff;
    min-height: 50px;
`;