import React, { createContext, useContext, FC } from 'react';

import { ThemeHandlerProps, ThemeValueProps, setThemeValueProps, setThemeModeProps, setThemeVersionProps} from './ThemeHandler.types';
import { usePersistedState } from '@gadeoli/rjs-hooks-library';

export const lightThemeKey = "light";
export const darkThemeKey = "dark";

export const themeValuesPattern : ThemeValueProps = {
    primary:        "#FFF",
    primary_text:   "#FFF",
    secondary:      "#FFF",
    secondary_text: "#FFF",
    success:        "#FFF",
    success_text:   "#FFF",
    danger:         "#FFF",
    danger_text:    "#FFF",
    disabled:       "#FFF",
    disabled_text:  "#FFF",
    background: "#FFF",
    body:       "#FFF",
    border:     "#FFF",
    link:       "#FFF",
    outline:    "#FFF",
    text:       "#FFF",
    fonts: {
        primary:    "sans-serif",
        secondary:  "sans-serif",
    },
    fontSize: {
        title:      "32",
        subtitle:   "24",
        text:       "12"
    },
    custom : {}
};

const initialSetTheme : setThemeValueProps = () => {}
const initialSetMode : setThemeModeProps = () => {}
const initialSetVersion : setThemeVersionProps = () => {}

const initialContextValues = {
    //keep the current theme key
    mode: lightThemeKey,
    //keep the current theme values
    theme: {...themeValuesPattern},
    //keep the dark and light theme values
    dark: {...themeValuesPattern},
    light: {...themeValuesPattern},
    version: null, //use version to force update the theme values
    //control mode, dark values and light values
    setMode: initialSetMode,
    setDarkValues: initialSetTheme,
    setLightValues: initialSetTheme,
    setVersion: initialSetVersion
}

export const ThemeContext = createContext({...initialContextValues});

const ThemeHandler: FC<ThemeHandlerProps> = ({children}) => {
    const [themeModePersisted, setThemeModePersisted] = usePersistedState('@rjs-theme-mode', lightThemeKey);
    const [themeVersionPersisted, setThemeVersionPersisted] = usePersistedState('@rjs-theme-version', null);
    const [themePersisted, setThemePersisted] = usePersistedState('@rjs-theme', {...themeValuesPattern});
    const [themeDarkPersisted, setThemeDarkPersisted] = usePersistedState('@rjs-theme-dark', {...themeValuesPattern});
    const [themeLightPersisted, setThemeLightPersisted] = usePersistedState('@rjs-theme-light', {...themeValuesPattern});

    return (<ThemeContext.Provider value={{
        mode: themeModePersisted,
        theme: themePersisted,
        dark: themeDarkPersisted,
        light: themeLightPersisted,
        version: themeVersionPersisted,
        setMode: (mode: string) => {            
            if(mode === lightThemeKey){
                setThemeModePersisted(lightThemeKey);
                setThemePersisted(themeLightPersisted);
            }else{
                setThemeModePersisted(darkThemeKey);
                setThemePersisted(themeDarkPersisted);
            }
        },
        setVersion: (version: string) => {   
            setThemeVersionPersisted(version);         
        },
        setDarkValues: (values: object) =>  setThemeDarkPersisted(values),
        setLightValues: (values: object) =>  setThemeLightPersisted(values),
    }}>
        {children}
    </ThemeContext.Provider>)
}

export const useTheme = () => useContext(ThemeContext);

export default ThemeHandler;