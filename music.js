const playlist = [
  {title:'Moo Moo Farm & Yoshi Valley',src:'assets/audio/moo-moo-yoshi.mp3'},
  {title:'3 Raceways & Wario Stadium',src:'assets/audio/raceways-wario.mp3'},
  {title:'Rainbow Road',src:'assets/audio/rainbow-road.mp3'}
];
const storageKey='kartlab.music.v1';
const audio=document.querySelector('#backgroundMusic');
const panel=document.querySelector('#musicPlayer');
const toggle=document.querySelector('#musicToggle');
const toggleText=document.querySelector('#musicToggleText');
const title=document.querySelector('#musicTrack');
const status=document.querySelector('#musicStatus');
const volume=document.querySelector('#musicVolume');
const volumeValue=document.querySelector('#musicVolumeValue');
const next=document.querySelector('#musicNext');
let preferences={volume:35,muted:false,index:0},started=false,failed=false;
try{
  const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
  if(saved){
    if(Number.isFinite(saved.volume))preferences.volume=Math.max(0,Math.min(100,saved.volume));
    preferences.muted=saved.muted===true;
    if(Number.isInteger(saved.index)&&saved.index>=0&&saved.index<playlist.length)preferences.index=saved.index;
  }
}catch{}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(preferences));}catch{}}
function applyVolume(){audio.volume=preferences.volume/100;audio.muted=preferences.muted;volume.value=preferences.volume;volumeValue.textContent=preferences.volume+' %';volume.setAttribute('aria-valuetext',preferences.volume+' por ciento');}
function render(){
  const silent=preferences.muted||preferences.volume===0;
  const playing=!audio.paused&&!failed;
  const label=silent?'Activar música':playing?'Silenciar música':'Reproducir música';
  toggle.setAttribute('aria-label',label);toggle.title=label;
  toggle.setAttribute('aria-pressed',String(silent));
  toggleText.textContent=silent?'Activar':playing?'Silenciar':'Escuchar';
  panel.dataset.state=failed?'error':silent?'muted':playing?'playing':'waiting';
  status.textContent=failed?'No se pudo cargar · Prueba la siguiente':silent?'MÚSICA SILENCIADA':playing?'KART RADIO · '+(preferences.index+1)+' / 3':'TOCA PARA ESCUCHAR';
  title.textContent=playlist[preferences.index].title;
}
async function play(){
  if(preferences.muted||preferences.volume===0)return;
  failed=false;
  try{await audio.play();started=true;}catch{ /* Browsers require a user gesture. The visible button can retry. */ }
  render();
}
function selectTrack(index,autoplay=true){
  preferences.index=(index+playlist.length)%playlist.length;
  audio.src=playlist[preferences.index].src;failed=false;applyVolume();save();render();
  if(autoplay)void play();
}
toggle.addEventListener('click',()=>{
  if(!started||audio.paused&&!preferences.muted){preferences.muted=false;if(preferences.volume===0)preferences.volume=35;}
  else{preferences.muted=!(preferences.muted||preferences.volume===0);if(!preferences.muted&&preferences.volume===0)preferences.volume=35;}
  applyVolume();save();render();if(!preferences.muted)void play();
});
volume.addEventListener('input',()=>{
  preferences.volume=Number(volume.value);if(preferences.volume>0)preferences.muted=false;
  applyVolume();save();render();if(audio.paused&&preferences.volume>0)void play();
});
next.addEventListener('click',()=>selectTrack(preferences.index+1));
audio.addEventListener('ended',()=>selectTrack(preferences.index+1));
audio.addEventListener('playing',()=>{started=true;failed=false;render();});
audio.addEventListener('pause',render);
audio.addEventListener('error',()=>{failed=true;render();});
// A single audio element lives outside all routed screens. Hash navigation never
// replaces it, so playback and the playlist continue across the entire site.
function unlock(event){
  if(event.target.closest?.('#musicPlayer'))return;
  if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
  if(!started&&!preferences.muted&&preferences.volume>0)void play();
}
document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
document.addEventListener('keydown',unlock,{capture:true});
applyVolume();selectTrack(preferences.index,false);
