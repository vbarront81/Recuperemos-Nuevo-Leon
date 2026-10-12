import {describe,it,expect} from 'vitest';
import {looksLikeImage} from '../src/lib/image-validation';
describe('firma de archivos de imagen',()=>{
  it('valida PNG correcto',()=>expect(looksLikeImage(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png')).toBe(true));
  it('rechaza HTML disfrazado de JPEG',()=>expect(looksLikeImage(new Uint8Array([60,104,116,109,108,62]),'image/jpeg')).toBe(false));
  it('rechaza MIME no admitido',()=>expect(looksLikeImage(new Uint8Array([1,2,3]),'image/svg+xml')).toBe(false));
});
