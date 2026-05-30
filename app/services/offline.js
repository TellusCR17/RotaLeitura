export const CACHE_VERSION = '1.0.2';

let dbOffline = null;

export function abrirBancoOffline(){

return new Promise((resolve,reject)=>{

const request = indexedDB.open('RotaLeituraDB',1);

request.onupgradeneeded = function(event){

const db = event.target.result;

if(!db.objectStoreNames.contains('areas')){

db.createObjectStore('areas');

}

};

request.onsuccess = function(event){

dbOffline = event.target.result;

resolve();

};

request.onerror = function(){

reject('Erro ao abrir IndexedDB');

};

});

}

export async function salvarAreaOffline(nomeArea,dados){

return new Promise((resolve,reject)=>{

const transaction =
dbOffline.transaction(['areas'],'readwrite');

const store = transaction.objectStore('areas');

const request = store.put({
 dados:dados,
  data:Date.now(),
  versao:CACHE_VERSION
},nomeArea);

request.onsuccess = ()=>resolve();

request.onerror = ()=>reject();

});

}

export async function lerAreaOffline(nomeArea){

return new Promise((resolve,reject)=>{

const transaction =
dbOffline.transaction(['areas'],'readonly');

const store = transaction.objectStore('areas');

const request = store.get(nomeArea);

request.onsuccess = ()=>{

resolve(request.result);

};

request.onerror = ()=>reject();

});

}

export async function sincronizarOffline({
permissoes,
indexes,
mostrarLoading,
ocultarLoading,
DEBUG = false
}){

try{

mostrarLoading(
'Sincronizando dados offline...'
);

for(const area of permissoes){

const cacheExistente =
await lerAreaOffline(area);

if(
   cacheExistente &&
   cacheExistente.versao === CACHE_VERSION
){

if(DEBUG){
console.log(
'Área já sincronizada:',
area
);
}

   continue;

}

let dadosOffline = [];

const arquivos = indexes[area] || [];

for(const arquivo of arquivos){

const response =
await fetch('./'+arquivo+'?v=' + CACHE_VERSION);

if(!response.ok){

throw new Error(
'Erro ao baixar ' + arquivo
);

}

const parte = await response.json();

dadosOffline.push(...parte);

}

await salvarAreaOffline(
area,
dadosOffline
);

if(DEBUG){
console.log(
'Área sincronizada:',
area
);
}

}

document.querySelector('.loadingTexto')
.innerText =
'✅ Offline pronto';

setTimeout(()=>{

ocultarLoading();

},800);

}catch(e){

console.error(e);

alert(
'Erro ao sincronizar offline'
);

ocultarLoading();

}

}
