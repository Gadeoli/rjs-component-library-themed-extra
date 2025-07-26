//dont change the order (right order small to bigger)
export enum CANVAS_SIZES {
    SM=400,
    MD=800,
    LG=1280,
    XL=2000,
    XXL=3000,
    XXXL=3400,
};

export const commonWrapWidth = [200, 400, 600];
export const commonFontSizesPt = [8, 10, 12, 14, 16, 18, 24, 36, 48, 72, 144];
export const commonBrushSizesPt = [1, 2, 3, 5, 7, 10, 15, 20, 25, 50, 75, 100, 125];

export const getBestWrapWidth = (canvasWidth : number | null) : number => {
    if(!canvasWidth){
        return 200;
    }else if(canvasWidth >= CANVAS_SIZES.XXXL){
        return 500;
    }else if(canvasWidth >= CANVAS_SIZES.XXL){
        return 400;
    }else if(canvasWidth >= CANVAS_SIZES.XL){
        return 300;
    }else{
        return 200;
    }
}

export const getBestFontSizesPt = (biggerCanvasSize : number | null) : number => {
    let index = 5;

    if(!biggerCanvasSize){
        index = 4;
    }else if(biggerCanvasSize >= CANVAS_SIZES.XXXL){
        index = 10;
    }else if(biggerCanvasSize >= CANVAS_SIZES.XXL){
        index = 9;
    }else if(biggerCanvasSize >= CANVAS_SIZES.XXL){
        index = 8;
    }else if(biggerCanvasSize >= CANVAS_SIZES.LG){
        index = 6;
    }else{
        index = 4;
    }

    return commonFontSizesPt[index];
}

export const getBestBrushSizePt = (biggerCanvasSize : number | null) : number => {
    let index = 5; 

    if(!biggerCanvasSize){
        index = 5;
    }else if (biggerCanvasSize >= CANVAS_SIZES.XXXL){
        index = 8;
    }else if (biggerCanvasSize >= CANVAS_SIZES.XXL){
        index = 7;
    }else if (biggerCanvasSize >= CANVAS_SIZES.XL){
        index = 6;
    }else if (biggerCanvasSize >= CANVAS_SIZES.LG){
        index = 5;
    }else{
        index = 5;
    }

    return commonBrushSizesPt[index];
}