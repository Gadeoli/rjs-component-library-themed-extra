import { themeValuesPattern } from "../ThemeHandler";

export const getDefaultThemeValues = () => {
    const myLightValues = {...themeValuesPattern};
    myLightValues.primary =       "#1D1E26";  
    myLightValues.primary_text =  "#FFF";
    myLightValues.secondary =     "#FCCC29";
    myLightValues.secondary_text ="#000";
    myLightValues.success =       "#ACF39D";
    myLightValues.success_text =  "#1D1E26";
    myLightValues.danger =        "#E85F5C";
    myLightValues.danger_text =   "#FFF";
    myLightValues.disabled =      "#DDD";
    myLightValues.disabled_text = "#DDD";
    myLightValues.background = "#FFFFFF";
    myLightValues.body =       "#F1F1F1";
    myLightValues.border =     "#F1F1F1",
    myLightValues.link =       "#0000EE";
    myLightValues.outline =    "#FF7F50";
    myLightValues.text =       "#333333";
    myLightValues.fonts.primary =   "comic sans";
    myLightValues.fonts.secondary = "comic sans";
    myLightValues.fontSize.title =      "2";
    myLightValues.fontSize.subtitle =   "1.5";
    myLightValues.fontSize.text =       "1";
    myLightValues.custom = {};

    const myDarkValues = {...themeValuesPattern};
    myDarkValues.primary =       "#121318";  
    myDarkValues.primary_text =  "#FFF";
    myDarkValues.secondary =     "#FCCC29";
    myDarkValues.secondary_text ="#000";
    myDarkValues.success =       "#ACF39D";
    myDarkValues.success_text =  "#1D1E26";
    myDarkValues.danger =        "#E85F5C";
    myDarkValues.danger_text =   "#FFF";
    myLightValues.disabled =     "#DDD";
    myLightValues.disabled_text ="#DDD";
    myDarkValues.background = "#1D1E26";
    myDarkValues.body =       "#333333";
    myDarkValues.border =     "#404040",
    myDarkValues.link =       "#0000EE";
    myDarkValues.outline =    "#FF7F50";
    myDarkValues.text =       "#FFFFFF";
    myDarkValues.fonts.primary =   "comic sans";
    myDarkValues.fonts.secondary = "comic sans";
    myDarkValues.fontSize.title =      "2";
    myDarkValues.fontSize.subtitle =   "1.5";
    myDarkValues.fontSize.text =       "1";
    myDarkValues.custom = {};

    return {
        light: myLightValues,
        dark: myDarkValues
    };
}



