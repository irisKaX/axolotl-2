import {it,expect} from 'vitest';
import {canonicalLibraryUrl} from './DesignSystem';
it('maps historical aliases and preserves theme without accepting a foreign redirect target',()=>{
 for(const search of ['?catalog=legacy','?catalog=headers','?section=layout'])expect(canonicalLibraryUrl(search,'light')).toBe('https://iriskax.github.io/axolotl-preview/ds-library-v1-1/?catalog=library&section=dashboard&theme=light#design-system');
 expect(canonicalLibraryUrl('?section=buttons&redirect=https://evil.test','dark')).toBe('https://iriskax.github.io/axolotl-preview/ds-library-v1-1/?catalog=library&section=buttons&theme=dark#design-system');
 expect(new URL(canonicalLibraryUrl('?section=https://evil.test','dark')).searchParams.has('section')).toBe(false);
});
