// busca.js

import { normalizar } from '../utils/normalizar.js';
import { buscarInstalacoes, listarMRUs } from '../services/database.js';

let bancoBusca = [];
let bancoBuscaIndexado = [];

export function indexarBusca(){

bancoBuscaIndexado = bancoBusca.map(item=>{

const textoCompleto = normalizar(
(item[0]||'')+' '+
(item[1]||'')+' '+
(item[2]||'')+' '+
(item[3]||'')+' '+
(item[4]||'')+' '+
(item[5]||'')+' '+
(item[6]||'')+' '+
(item[7]||'')
);

return {
dados:item,
texto:textoCompleto,
mru:normalizar(item[0]||'')
};

});

}

export async function carregarArea({

areaSelect,
listaMRUs,
atualizarStatusOffline,
mostrarLoading,
ocultarLoading

}){

try{

mostrarLoading('Carregando instalações...');

bancoBusca = [];

const area = areaSelect.value;

if(!area){

ocultarLoading();
return;

}

	bancoBusca = await buscarInstalacoes(area, '', '');

await atualizarStatusOffline(area);

indexarBusca();

	const mrus = await listarMRUs(area);

mrus.sort();

listaMRUs.innerHTML='';

mrus.forEach(mru=>{

listaMRUs.innerHTML += `
<option value="${mru}">
`;

});

ocultarLoading();

}catch(e){

console.error(e);

alert(
'Erro ao carregar área.\n\n' +
(e.message || e)
);

ocultarLoading();

}

}

export function pesquisar({

inputMRU,
inputBusca,
resultadosDiv

}){

if(
inputBusca.value.trim().length < 5 &&
inputMRU.value.trim().length < 5
){

resultadosDiv.innerHTML = '';
return;

}

if(
inputBusca.value.trim() === '' &&
inputMRU.value.trim() === ''
){

resultadosDiv.innerHTML = '';
return;

}

const filtroMRU =
normalizar(inputMRU.value);

const filtroTexto =
normalizar(inputBusca.value);

const resultados = [];

for(
let i = 0;
i < bancoBuscaIndexado.length;
i++
){

const item =
bancoBuscaIndexado[i];

const okMRU =
!filtroMRU ||
item.mru.includes(filtroMRU);

const okTexto =
!filtroTexto ||
item.texto.includes(filtroTexto);

if(okMRU && okTexto){

resultados.push(item.dados);

}

}

let html = `
<div class="contadorResultados">
${resultados.length} resultado(s)
</div>
`;

if(resultados.length===0){

html += `
<div class="card">
Nenhum resultado encontrado.
</div>
`;

}

resultados.forEach(item=>{

html += `
<div class="card">

<div class="infoTitulo">⚡ Instalação</div>
<div class="infoValor">${item[1] || ''}</div>

<div class="infoTitulo">🔢 Medidor</div>
<div class="infoValor">${item[2] || ''}</div>

<div class="infoTitulo">📍 Endereço</div>
<div class="infoValor">
${item[3] || ''}, ${item[4] || ''}
</div>

<div class="infoTitulo">🗺 Bairro</div>
<div class="infoValor">${item[5] || ''}</div>

<div class="infoTitulo">🏙 Cidade</div>
<div class="infoValor">${item[6] || ''}</div>

<div class="infoTitulo">👤 Cliente</div>
<div class="infoValor">${item[7] || ''}</div>

<a class="botao"
href="${item[10] || '#'}"
target="_blank">

🗺 Navegar

</a>

</div>
`;

});

resultadosDiv.innerHTML = html;

}
