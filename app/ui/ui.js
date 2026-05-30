import { areaOfflineDisponivel } from '../services/database.js';

export function obterElementosUI(){

return {
loginTela: document.getElementById('loginTela'),
appTela: document.getElementById('appTela'),
areaSelect: document.getElementById('area'),
areaMapaSelect: document.getElementById('areaMapa'),
listaMRUs: document.getElementById('listaMRUs'),
listaMRUsMapa: document.getElementById('listaMRUsMapa'),
abaBusca: document.getElementById('abaBusca'),
abaMapa: document.getElementById('abaMapa'),
btnBusca: document.getElementById('btnBusca'),
btnMapa: document.getElementById('btnMapa'),
loadingTela: document.getElementById('loadingTela'),
offlineAviso: document.getElementById('offlineAviso'),
resultadosDiv: document.getElementById('resultados'),
statusOfflineCard: document.getElementById('statusOfflineCard'),
inputMRU: document.getElementById('mru'),
inputBusca: document.getElementById('busca'),
inputMRUMapa: document.getElementById('mruMapa')
};

}

export function mostrarLoading(texto='Carregando...'){

const loadingTela = document.getElementById('loadingTela');

loadingTela.classList.remove('oculto');

document.querySelector('.loadingTexto')
.innerText = texto;

}

export function ocultarLoading(){

const loadingTela = document.getElementById('loadingTela');

loadingTela.classList.add('oculto');

}

export function popularAreas({
permissoes,
AREAS,
areaSelect,
areaMapaSelect,
carregarArea
}){

let html = '<option value="">Selecionar Área</option>';

permissoes.forEach(area=>{

html += `
<option value="${area}">
${area} - ${AREAS[area]}
</option>
`;

});

areaSelect.innerHTML = html;
areaMapaSelect.innerHTML = html;

if(permissoes.length === 1){

areaSelect.value = permissoes[0];
areaMapaSelect.value = permissoes[0];

areaSelect.style.display='none';
areaMapaSelect.style.display='none';

carregarArea();

}

}

export async function atualizarStatusOffline(
area,
statusOfflineCard
){

const offline = await areaOfflineDisponivel(area);

statusOfflineCard.classList.remove('oculto');

if(offline){

statusOfflineCard.innerHTML = `

<div class="statusOk">
🟢 Busca Offline Disponível
</div>

<div style="margin-top:8px;">
Os dados da área estão salvos neste aparelho.
</div>

<div style="margin-top:14px;" class="statusAlerta">
🟡 Mapas parcialmente offline
</div>

<div style="margin-top:8px;">
Abra a região online ao menos 1x para melhor funcionamento do mapa offline.
</div>

`;

}else{

statusOfflineCard.innerHTML = `

<div class="statusErro">
🔴 Área ainda não sincronizada
</div>

<div style="margin-top:8px;">
Conecte-se à internet para carregar os dados desta área.
</div>

`;

}

}

export function abrirAba({
tipo,
abaBusca,
abaMapa,
btnBusca,
btnMapa,
resultadosDiv,
destruirMapa,
invalidarMapa
}){

abaBusca.classList.add('oculto');
abaMapa.classList.add('oculto');

btnBusca.classList.remove('ativa');
btnMapa.classList.remove('ativa');

if(tipo === 'busca'){

destruirMapa();

abaBusca.classList.remove('oculto');
btnBusca.classList.add('ativa');

}else{

resultadosDiv.innerHTML = '';

abaMapa.classList.remove('oculto');
btnMapa.classList.add('ativa');

setTimeout(()=>{

invalidarMapa();

},300);

}

}

export function atualizarInternet(offlineAviso){

if(navigator.onLine){

offlineAviso.classList.add('oculto');

}else{

offlineAviso.classList.remove('oculto');

}

}
