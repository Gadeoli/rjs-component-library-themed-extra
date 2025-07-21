import React, { useEffect, useState, ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import CanvasEditor from './CanvasEditor';

type StoryProps = ComponentProps<typeof CanvasEditor> & {
    testSrcUrl: string | null | undefined;
};

const meta: Meta<StoryProps> = {
    component: CanvasEditor,
    title: "RjsComponentLibraryThemed/CanvasImageEditor",
};

export default meta;

type Story = StoryObj<StoryProps>;

export const Default: Story = {
    args: {
        testSrcUrl: "",
        onExportToImage: ({src, e}) => console.log({src, e}),
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
        onExportToImage: {
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

        return (<div>
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

            <CanvasEditor {...{...args, backgroundSrc: bgSource}} onExportToImage={(props : any) => setSavedSrc(props.src)}/>

            <img src={savedSrc} alt='saved img - preview' style={{width: '300px', marginTop: '40px'}}/>
        </div>)
    }
};