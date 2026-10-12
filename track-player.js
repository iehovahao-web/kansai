(()=>{
'use strict';
const audio=document.getElementById('delicious-audio');
const controls=document.getElementById('delicious-controls');
if(!audio||!controls)return;
const get=id=>document.getElementById('delicious-'+id);
const toggle=get('toggle'),seek=get('seek'),volume=get('volume');
const current=get('current'),duration=get('duration'),error=get('error');
const format=n=>{n=Number.isFinite(n)?Math.max(0,n):0;return Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0')};
let confirmedPlaying=false;
function state(){
 const playing=confirmedPlaying&&!audio.paused&&!audio.ended&&!audio.error;
 for(const kind of ['icon','label']){
  controls.querySelector('[data-play-'+kind+']').toggleAttribute('hidden',playing);
  controls.querySelector('[data-pause-'+kind+']').toggleAttribute('hidden',!playing);
 }
}
function progress(){
 const valid=Number.isFinite(audio.duration)&&audio.duration>0;
 seek.disabled=!valid;get('back').disabled=!valid;get('forward').disabled=!valid;
 current.textContent=format(audio.currentTime);
 if(valid){duration.textContent=format(audio.duration);seek.value=String(Math.round(audio.currentTime/audio.duration*1000));seek.style.setProperty('--fill',(audio.currentTime/audio.duration*100)+'%');seek.setAttribute('aria-valuetext',format(audio.currentTime)+' / '+format(audio.duration));}
}
toggle.addEventListener('click',()=>{
 if(audio.paused||audio.ended){error.hidden=true;audio.play().catch(()=>{confirmedPlaying=false;error.hidden=false;state()})}
 else audio.pause();
});
seek.addEventListener('input',()=>{
 if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Number(seek.value)/1000*audio.duration;progress()}
});
for(const [id,offset] of [['back',-10],['forward',10]])get(id).addEventListener('click',()=>{
 if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+offset));progress()}
});
const airplay=get('airplay');
if(typeof audio.webkitShowPlaybackTargetPicker==='function'){
 audio.addEventListener('webkitplaybacktargetavailabilitychanged',event=>{airplay.hidden=event.availability!=='available'});
 airplay.addEventListener('click',()=>{try{audio.webkitShowPlaybackTargetPicker()}catch(_){airplay.hidden=true}});
}
// iOS uses hardware/system volume. Detect unsupported setters elsewhere too.
let canSetVolume=!(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
if(canSetVolume){const previous=audio.volume;try{audio.volume=.5;canSetVolume=Math.abs(audio.volume-.5)<.01;audio.volume=previous}catch(_){canSetVolume=false}}
get('volume-group').hidden=!canSetVolume;
get('device-volume').hidden=canSetVolume;
if(canSetVolume){
 volume.value=String(audio.volume);volume.style.setProperty('--fill',(audio.volume*100)+'%');
 volume.addEventListener('input',()=>{audio.volume=Number(volume.value);audio.muted=false});
 audio.addEventListener('volumechange',()=>{volume.value=String(audio.muted?0:audio.volume);volume.style.setProperty('--fill',(Number(volume.value)*100)+'%')});
}
for(const event of ['loadedmetadata','durationchange','timeupdate','seeked','ended'])audio.addEventListener(event,progress);
audio.addEventListener('playing',()=>{confirmedPlaying=true;error.hidden=true;state()});
for(const event of ['play','pause','ended','waiting','loadstart','emptied','abort'])audio.addEventListener(event,()=>{confirmedPlaying=false;state()});
audio.addEventListener('error',()=>{confirmedPlaying=false;error.hidden=false;seek.disabled=true;get('back').disabled=true;get('forward').disabled=true;state()});
state();progress();
// Keep native controls available if scripting cannot initialize.
controls.hidden=false;audio.controls=false;audio.hidden=true;
})();
