import { listarInstalacoesMapa, listarMRUs } from '../services/database.js';

let map = null;
let watchId = null;
let bancoMapa = [];

export async function carregarAreaMapa({

areaMapaSelect,
listaMRUsMapa,


mostrarLoading,
ocultarLoading

}){

try{

mostrarLoading('Carregando mapa...');

bancoMapa = [];

const area = areaMapaSelect.value;

if(!area){

ocultarLoading();
return;

}






   bancoMapa = await listarInstalacoesMapa(area, '');

   if(!bancoMapa || bancoMapa.length === 0){
      throw new Error(
         'Área offline não encontrada'
      );
   }

   const mrus = await listarMRUs(area);

mrus.sort();

listaMRUsMapa.innerHTML='';

mrus.forEach(mru=>{

listaMRUsMapa.innerHTML += `
<option value="${mru}">
`;

});

ocultarLoading();

}catch(e){

console.error(e);

alert(
'Erro ao carregar mapa.\n\n' +
(e.message || e)
);

ocultarLoading();

}

}

export function carregarMapa({

inputMRUMapa,
DEBUG = false

}){

let dados =
bancoMapa.filter(
i=>i[0] == inputMRUMapa.value
);

if(dados.length===0){

alert(
'Nenhuma instalação encontrada'
);

return;

}

let primeiro =
dados.find(
i=>i[8] !== 'nan' &&
i[9] !== 'nan'
);

if(!primeiro){

alert(
'Sem coordenadas válidas'
);

return;

}

if(map){

map.remove();

}

map = L.map('map',{

preferCanvas:true,
zoomAnimation:false,
fadeAnimation:false,
markerZoomAnimation:false

}).setView([

parseFloat(primeiro[8]),
parseFloat(primeiro[9])

],15);

const mapaPadrao = L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
attribution:'© OpenStreetMap'
}
);

const mapaSatelite = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
{
attribution:'© Esri'
}
);

mapaPadrao.addTo(map);

/* =========================
   GPS
========================= */

let marcadorUsuario = null;

if(navigator.geolocation){

if(watchId){

navigator.geolocation.clearWatch(
watchId
);

watchId = null;

}

watchId =
navigator.geolocation.watchPosition(

(posicao)=>{

const latUser =
posicao.coords.latitude;

const lngUser =
posicao.coords.longitude;

if(marcadorUsuario){

marcadorUsuario.setLatLng([
latUser,
lngUser
]);

}else{

marcadorUsuario =
L.circleMarker(
[latUser,lngUser],
{
radius:10,
color:'#FFFFFF',
weight:3,
fillColor:'#00E676',
fillOpacity:1
}
).addTo(map);

marcadorUsuario.bringToFront();

if(!map._usuarioCentralizado){

map.setView(
[latUser,lngUser],
17
);

map._usuarioCentralizado =
true;

}

marcadorUsuario.bindPopup(`
<div style="
font-family:Inter,sans-serif;
font-weight:600;
">
📍 Sua localização
</div>
`);

}

},

(erro)=>{

if(DEBUG){

console.log(
'Erro GPS:',
erro
);

}

},

{
enableHighAccuracy:true,
maximumAge:5000,
timeout:10000
}

);

}

/* =========================
   LEAFLET
========================= */

L.control.layers({

'🗺 Mapa':mapaPadrao,
'🛰 Satélite':mapaSatelite

}).addTo(map);

const bounds = [];

/* =========================
   CLUSTERS
========================= */

const clusterGroup =
L.markerClusterGroup({

maxClusterRadius:20,

spiderfyOnMaxZoom:true,
showCoverageOnHover:false,
zoomToBoundsOnClick:true,

iconCreateFunction:function(cluster){

const count =
cluster.getChildCount();

return L.divIcon({

html:`
<div style="
background:#1976D2;
color:white;
width:42px;
height:42px;
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
font-weight:700;
font-size:14px;
border:3px solid white;
box-shadow:0 0 10px rgba(0,0,0,.35);
">
${count}
</div>
`,

className:'',
iconSize:[42,42]

});

}

});

for(let i = 0; i < dados.length; i++){

const item = dados[i];

if(
item[8] == 'nan' ||
item[9] == 'nan' ||
!item[8] ||
!item[9]
) continue;

const lat =
parseFloat(item[8]);

const lng =
parseFloat(item[9]);

bounds.push([lat,lng]);

const marker =
L.circleMarker(
[lat,lng],
{
radius:8,
color:'#FFFFFF',
weight:3,
fillColor:'#00B0FF',
fillOpacity:1
}
);

marker.instalacao =
item[1] || '-';

marker.options.link =
item[10];

marker.on(
'mouseover',
function(){

this.setStyle({
fillColor:'#FF6D00'
});

}
);

marker.on(
'mouseout',
function(){

this.setStyle({
fillColor:'#00B0FF'
});

}
);

marker.bindPopup(`

<div style="
font-family:Inter,sans-serif;
min-width:220px;
">

<div style="
font-weight:700;
font-size:15px;
margin-bottom:10px;
color:#031D44;
">
⚡ ${item[1]}
</div>

<div style="margin-bottom:8px;">
<b>👤 Cliente:</b><br>
${item[7] || '-'}
</div>

<div style="margin-bottom:8px;">
<b>🔢 Medidor:</b><br>
${item[2] || '-'}
</div>

<div style="margin-bottom:12px;">
<b>📍 Endereço:</b><br>
${item[3] || '-'},
${item[4] || ''}
</div>

<a
href="${item[10]}"
target="_blank"
style="
display:block;
background:#1976D2;
color:white;
text-align:center;
padding:12px;
border-radius:12px;
text-decoration:none;
font-weight:600;
">
🗺 Navegar
</a>

</div>

`);

clusterGroup.addLayer(
marker
);

marker.bringToFront();

}

map.addLayer(clusterGroup);

clusterGroup.on(
'clusterclick',
function(a){

const markers =
a.layer.getAllChildMarkers();

let html = `
<div style="
max-height:320px;
overflow:auto;
min-width:260px;
font-family:Inter,sans-serif;
">
`;

markers.forEach((m,index)=>{

html += `
<div style="
padding:10px 0;
">

<div style="
font-weight:700;
font-size:14px;
margin-bottom:6px;
">
⚡ Instalação
</div>

<div style="
margin-bottom:10px;
font-weight:600;
color:#031D44;
">
${m.instalacao || '-'}
</div>

<button
onclick="window.open('${m.options.link}','_blank')"
style="
background:#1976D2;
color:white;
border:none;
padding:10px 14px;
border-radius:10px;
font-weight:600;
cursor:pointer;
width:100%;
"
>
🗺 Navegar
</button>

</div>
`;

if(index < markers.length - 1){

html += `
<hr style="
border:none;
border-top:1px solid #E2E8F0;
margin:14px 0;
">
`;

}

});

html += `</div>`;

L.popup({
maxWidth:320
})
.setLatLng(
a.layer.getLatLng()
)
.setContent(html)
.openOn(map);

}
);

if(bounds.length > 0){

map.fitBounds(
bounds,
{
padding:[30,30]
}
);

}

if(marcadorUsuario){

setTimeout(()=>{

map.setView(
marcadorUsuario.getLatLng(),
17
);

},1000);

}

setTimeout(()=>{

map.invalidateSize();

},300);

}

export function destruirMapa(){

if(watchId){

navigator.geolocation.clearWatch(
watchId
);

watchId = null;

}

if(map){

map.remove();
map = null;

}

const mapaDiv =
document.getElementById('map');

if(mapaDiv){

mapaDiv.innerHTML = '';

}

}

export function invalidarMapa(){

if(map){
map.invalidateSize();
}

}
