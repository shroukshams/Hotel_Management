import{load}from'./store.js';
import{shell}from'../ui/shell.js';
import{render}from'../modules/pages.js';
import{renderV2}from'../modules/v2-pages.js';
import{renderSettingsV2}from'../modules/v2-settings.js';
const state=load(),page=location.pathname.split('/').pop()||'index.html';
document.documentElement.dataset.theme=localStorage.getItem('hms-theme')||state.settings.theme||'light';
shell(page,state.settings.hotelName);
if(page==='settings.html')renderSettingsV2(state);else if(!renderV2(page,state))render(page,state);
