import React from 'react';
import ThemeHandler from './ThemeHandler';
import { ThemeHandlerProps } from './ThemeHandler.types';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: "RjsComponentLibraryThemed/ThemeHandler",
    component: ThemeHandler,
    render: ({...args}: ThemeHandlerProps) => (<ThemeHandler {...args}/>),
}