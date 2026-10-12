(()=>{
'use strict';
const selector='.image-button,.original-thumbs button,.album-artwork,.video-stage,.single-controls';
const held=new Map();
function release(id){const host=held.get(id);held.delete(id);if(host&&![...held.values()].includes(host))host.classList.remove('is-glass-pressed')}
function clear(){for(const id of [...held.keys()])release(id)}
document.addEventListener('pointerdown',event=>{
 if(event.pointerType!=='touch'&&event.pointerType!=='pen')return;
 const host=event.target.closest?.(selector);if(!host)return;
 release(event.pointerId);held.set(event.pointerId,host);host.classList.add('is-glass-pressed');
},{capture:true,passive:true});
for(const type of ['pointerup','pointercancel'])window.addEventListener(type,event=>release(event.pointerId),{capture:true,passive:true});
window.addEventListener('blur',clear);
window.addEventListener('scroll',clear,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
})();
