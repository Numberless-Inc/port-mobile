import {useMemo} from 'react';

import {useTheme} from 'src/context/ThemeContext';

interface SVGOptions {
  assetName: string;
  light: any;
  dark: any;
}

/**
 * @deprecated
 * Dynamically retrieves SVG assets based on the current theme.
 * @param svgArray An array of objects containing SVG asset information.
 * @returns An object mapping SVG asset names to their corresponding SVG content based on the current theme.
 */

function useDynamicSVG(svgArray: SVGOptions[]): any {
  const {themeValue} = useTheme();

  return useMemo(() => {
    const resultsObj: any = {};
    svgArray.forEach(item => {
      resultsObj[item.assetName] =
        item[themeValue && themeValue === 'light' ? 'light' : 'dark'];
    });
    return resultsObj;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeValue]);
}

export default useDynamicSVG;
