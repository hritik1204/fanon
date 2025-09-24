import Constants from 'expo-constants';
import { Dimensions, PixelRatio } from 'react-native';



const { width, height } = Dimensions.get('window');
const figmaWidth = 360;
const figmaHeight = 800;



const statusBarHeight = Constants.statusBarHeight;

function scale(size: number): number {
  return width * 2 < height
    ? (height / width / 1.2) * size
    : (height / width) * size;
}

function horizontalScaleConversion(size: number) {
  return Math.round(
    PixelRatio.roundToNearestPixel((size * width) / figmaWidth)
  );
}

function verticalScaleConversion(size: number) {
  return PixelRatio.roundToNearestPixel((size * height) / figmaHeight);
}

const SCREEN_WIDTH = horizontalScaleConversion(width);
const SCREEN_HEIGHT = verticalScaleConversion(height);
const SCREEN_HEIGHT_HORIZONTAL_SCALE = horizontalScaleConversion(height);

export {
  figmaHeight,
  figmaWidth,
  height,
  horizontalScaleConversion,
  scale,
  SCREEN_HEIGHT,
  SCREEN_HEIGHT_HORIZONTAL_SCALE,
  SCREEN_WIDTH,
  statusBarHeight,
  verticalScaleConversion,
  width,
};
