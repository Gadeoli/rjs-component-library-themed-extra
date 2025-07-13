import React, { useEffect } from 'react';
import { getDefaultThemeValues } from './values';
import { 
    CardContent, 
    ThemeHandler,   
    ThemeContext, 
    Toggle,
    Span,
    Card,
    GlobalStyle,
    darkThemeKey,
    lightThemeKey
} from '@gadeoli/rjs-component-library-themed';

interface HandlerTestProps{
    children: React.ReactNode;
};

const ThemeInit = ({
    version,
    setVersion,

    mode, 
    setMode,

    setLightValues,
    setDarkValues
} : any) => {    
    const themeValues = getDefaultThemeValues();

    //set initial theme
    //and update current theme values after update theme (light, dark) values
    useEffect(() => {
        setMode(mode);
    }, [version]);

    //set theme values (simplest case)
    //you can get values from store, from a api request, from both etc...
    useEffect(() => {
        const newVersion = !version ? 0 : version + 1;

        setDarkValues(themeValues.dark);
        setLightValues(themeValues.light);

        setVersion(newVersion); //remember to update theme version after change values
    }, []);

    return (<GlobalStyle />);
}

const App4Test = (props: HandlerTestProps) => {
    return <ThemeHandler>
        <ThemeContext.Consumer>{(props) => <ThemeInit {...props}/>}</ThemeContext.Consumer>

        <ThemeContext.Consumer>
            {({
                mode, 
                setMode
            }) => {    
                return <>
                    <Card style={styles.card}>
                        <CardContent style={styles.card.content}>
                            <Span style={styles.toggle.text}>Current theme: {mode}</Span>
                            <Toggle
                                value={mode}
                                checkedValue={lightThemeKey}
                                uncheckedValue={darkThemeKey}
                                onChange={(value: any) => {
                                    setMode(value);
                                }}
                            />
                        </CardContent>
                    </Card>
                </>;
            }}
        </ThemeContext.Consumer>
        {props.children}
    </ThemeHandler>
}

export default App4Test;

const styles = {
    card: {
        marginBottom: '20px',

        content: {
            display: 'flex'
        }
    },
    toggle: {
        text: {
            marginRight: '20px'
        }
    }
};

