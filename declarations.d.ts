declare module '*.svg' {
  import React from 'react';

  import {SvgProps} from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.png' {
  const value: number; // React Native returns a number for static assets
  export default value;
}
