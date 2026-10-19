import {forwardRef} from 'react';
import {Button as OriginalButton} from '../button-studio-01/Button';
// Reuse the entire original implementation, including the official Star Border.
export const LensButton=forwardRef(function LensButton({clean=false,className='',...props},ref){
 return <OriginalButton {...props} ref={ref} family="lens" className={`${className}${clean?' lens-clean':''}`}/>;
});
