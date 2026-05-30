import { auth, db } from './config/firebase.js';

import {
fazerLogin,
logout,
verificarPermissaoAtual,
iniciarAuthListener
} from './services/auth.js';

import {
CACHE_VERSION,
abrirBancoOffline,
sincronizarOffline
} from './services/offline.js';

import {
obterElementosUI,
mostrarLoading,
ocultarLoading,
popularAreas,
atualizarStatusOffline,
abrirAba,
atualizarInternet
} from './ui/ui.js';

import {
carregarArea,
pesquisar
} from './js/busca.js';

import {
carregarAreaMapa,
carregarMapa,
destruirMapa,
invalidarMapa
} from './js/mapa.js';

const AREAS = {
"171":"ITABUNA",
"172":"IBICARAI",
"173":"ILHÉUS",
"174":"COARACI",
"175":"CANAVIEIRAS",
"176":"CAMACAN"
};

const DEBUG = false;

let permissoes = [];
let indexes = {};
let timerBusca = null;

const ui = obterElementosUI();

await abrirBancoOffline();

setTimeout(()=>{

ocultarLoading();

},10000);

window.fazerLogin = async function(){

await fazerLogin(
auth,
mostrarLoading,
ocultarLoading
);

};

async function logoutAtual(){

await logout(auth);

}

window.logout = logoutAtual;

async function verificarAcessoAtual(){

await verificarPermissaoAtual(
auth,
db,
logoutAtual
);

}

async function carregarSistema(){

try{

mostrarLoading('Carregando sistema...');

const response = await fetch('./database/indexes.json?v=' + CACHE_VERSION);

if(!response.ok){

throw new Error('database/indexes.json não encontrado');

}

try{

indexes = await response.json();

}catch{

throw new Error(
'database/indexes.json corrompido'
);

}

popularAreas({
permissoes,
AREAS,
areaSelect: ui.areaSelect,
areaMapaSelect: ui.areaMapaSelect,
carregarArea: carregarAreaAtual
});

ocultarLoading();

}catch(e){

console.error(e);

alert(
'Erro ao carregar database/indexes.json\n\n' +
(e.message || e)
);

ocultarLoading();

}

}

async function sincronizarOfflineAtual(){

await sincronizarOffline({
permissoes,
indexes,
mostrarLoading,
ocultarLoading,
DEBUG
});

}

async function atualizarStatusOfflineAtual(area){

await atualizarStatusOffline(
 area,
 ui.statusOfflineCard
);


}

async function carregarAreaAtual(){

await carregarArea({
areaSelect: ui.areaSelect,
listaMRUs: ui.listaMRUs,
atualizarStatusOffline: atualizarStatusOfflineAtual,
mostrarLoading,
ocultarLoading
});

}

async function carregarAreaMapaAtual(){

await carregarAreaMapa({
areaMapaSelect: ui.areaMapaSelect,
listaMRUsMapa: ui.listaMRUsMapa,
mostrarLoading,
ocultarLoading
});

}

function pesquisarAtual(){

pesquisar({
inputMRU: ui.inputMRU,
inputBusca: ui.inputBusca,
resultadosDiv: ui.resultadosDiv
});

}

ui.areaSelect.addEventListener('change', carregarAreaAtual);
ui.areaMapaSelect.addEventListener('change', carregarAreaMapaAtual);

ui.inputMRU.addEventListener('input', ()=>{

clearTimeout(timerBusca);

timerBusca = setTimeout(()=>{
pesquisarAtual();
},80);

});

ui.inputBusca.addEventListener('input', ()=>{

clearTimeout(timerBusca);

timerBusca = setTimeout(()=>{
pesquisarAtual();
},80);

});

window.abrirAba = function(tipo){

abrirAba({
tipo,
abaBusca: ui.abaBusca,
abaMapa: ui.abaMapa,
btnBusca: ui.btnBusca,
btnMapa: ui.btnMapa,
resultadosDiv: ui.resultadosDiv,
destruirMapa,
invalidarMapa
});

};

window.carregarMapa = function(){

carregarMapa({
inputMRUMapa: ui.inputMRUMapa,
DEBUG
});

};

function atualizarInternetAtual(){

atualizarInternet(ui.offlineAviso);

}

window.addEventListener(
'online',
()=>{

atualizarInternetAtual();

verificarAcessoAtual();

}
);

window.addEventListener('offline', atualizarInternetAtual);

atualizarInternetAtual();

if ('serviceWorker' in navigator) {

window.addEventListener('load', async ()=>{

try{

const registro =
await navigator.serviceWorker.register('./sw.js');

if(DEBUG){
console.log('SW registrado');
}

registro.update();

registro.addEventListener('updatefound', ()=>{

const novoWorker = registro.installing;

novoWorker.addEventListener('statechange', ()=>{

if(
novoWorker.state === 'installed' &&
navigator.serviceWorker.controller
){

if(DEBUG){
console.log('Nova versão disponível');
}

}

});

});

}catch(e){

console.error('Erro SW:', e);

}

});

}

ocultarLoading();

document.addEventListener(
'visibilitychange',
()=>{

if(
document.visibilityState === 'visible' &&
navigator.onLine
){

verificarAcessoAtual();

}

}
);

iniciarAuthListener({
auth,
db,
loginTela: ui.loginTela,
appTela: ui.appTela,
mostrarLoading,
ocultarLoading,
carregarSistema,
sincronizarOffline: sincronizarOfflineAtual,
setPermissoes(novasPermissoes){
permissoes = novasPermissoes;
},
logoutFn: logoutAtual
});
