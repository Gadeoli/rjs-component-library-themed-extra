import React from "react";

export interface ThemeHandlerProps {
    // setTheme (theme: object) : any;
    children: React.ReactNode
}

export interface setThemeValueProps { (values: object) : any };

export interface setThemeModeProps { (mode: string) : any };

export interface setThemeVersionProps { (version: string) : any };

export interface ThemeValueProps {
    primary:        string;
    primary_text:   string;
    secondary:      string;
    secondary_text: string;
    success:        string;
    success_text:   string;
    danger:         string;
    danger_text:    string;
    disabled:       string;
    disabled_text:  string;
    
    background: string;
    body:       string;
    border:     string;
    link:       string;
    outline:    string;
    text:       string;

    fonts:      ThemeFontValueProps;
    fontSize:   ThemeFontSizeValueProps;

    custom:     object;
};

export interface ThemeFontValueProps {
    primary:    string;
    secondary:  string;
}

export interface ThemeFontSizeValueProps {
    title:      string;
    subtitle:   string;
    text:       string;
}