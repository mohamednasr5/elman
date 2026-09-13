/**
 * image-cdn.service.js
 * R2 & Cloudflare CDN Image Optimizer
 * Standardized responsive image variants with a dedicated high-resolution cover.
 */
import { R2_PUBLIC_URL } from '../core/firebase.js';
export const IMAGE_SIZES={LOGO:'logo',THUMB:'thumb',MEDIUM:'medium',COVER:'cover',ORIGINAL:'orig'};
export function getOptimizedImageUrl(url,size=IMAGE_SIZES.THUMB){if(!url||typeof url!=='string')return '';const cleanUrl=url.trim();if(cleanUrl.startsWith('data:')||cleanUrl.endsWith('.svg'))return cleanUrl;
  if(cleanUrl.includes('images.unsplash.com')){const width=size===IMAGE_SIZES.LOGO?90:(size===IMAGE_SIZES.THUMB?420:(size===IMAGE_SIZES.MEDIUM?900:(size===IMAGE_SIZES.COVER?1440:1800)));const quality=size===IMAGE_SIZES.LOGO?82:(size===IMAGE_SIZES.THUMB?82:88);try{const u=new URL(cleanUrl);u.searchParams.set('w',String(width));u.searchParams.set('q',String(quality));u.searchParams.set('auto','format');u.searchParams.set('fit','crop');if(size===IMAGE_SIZES.LOGO)u.searchParams.set('h','90');else if(size===IMAGE_SIZES.THUMB)u.searchParams.set('h','236');else if(size===IMAGE_SIZES.MEDIUM)u.searchParams.set('h','560');else if(size===IMAGE_SIZES.COVER)u.searchParams.set('h','630');return u.toString();}catch(_){return cleanUrl;}}
  if(cleanUrl.includes('r2.dev')||(R2_PUBLIC_URL&&cleanUrl.includes(R2_PUBLIC_URL))){const params=new URLSearchParams();if(size===IMAGE_SIZES.LOGO){params.set('w','96');params.set('h','96');params.set('fit','cover');params.set('q','88');}else if(size===IMAGE_SIZES.THUMB){params.set('w','420');params.set('h','236');params.set('fit','cover');params.set('q','86');}else if(size===IMAGE_SIZES.MEDIUM){params.set('w','900');params.set('h','560');params.set('fit','cover');params.set('q','88');}else if(size===IMAGE_SIZES.COVER){params.set('w','1440');params.set('h','630');params.set('fit','cover');params.set('q','90');}else return cleanUrl;params.set('src',cleanUrl);return '/api/image?'+params.toString();}
  return cleanUrl;
}
