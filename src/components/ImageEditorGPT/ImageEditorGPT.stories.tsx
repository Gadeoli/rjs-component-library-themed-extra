import React, { ComponentProps } from "react";
import { Meta, StoryObj } from "@storybook/react";
import ImageEditorGPT from './ImageEditorGPT';

type StoryProps = ComponentProps<typeof ImageEditorGPT> & {
    testSrcUrl: string | null | undefined;
};

const meta: Meta<StoryProps> = {
    component: ImageEditorGPT,
    title: "RjsComponentLibraryThemed/ImageEditorGPT",
};

export default meta;

type Story = StoryObj<StoryProps>;

export const Default: Story = {
    args: {
        
    },
    argTypes: {
  
    },
    render: () => {
        return (<div>
            <ImageEditorGPT />
        </div>)
    }
};