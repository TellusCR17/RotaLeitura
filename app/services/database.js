import { lerAreaOffline } from './offline.js';
import { normalizar } from '../utils/normalizar.js';
import {
  listarAreas as sqliteListarAreas,
  listarMRUs as sqliteListarMRUs,
  buscarInstalacoes as sqliteBuscarInstalacoes,
  listarInstalacoesMapa as sqliteListarInstalacoesMapa
} from './sqlite.js';

function obterDadosDaArea(cache){

  if(!cache || !Array.isArray(cache.dados)){
    return [];
  }

  return cache.dados;

}

function textoInstalacao(item){

  return normalizar(
    (item[0]||'')+' '+
    (item[1]||'')+' '+
    (item[2]||'')+' '+
    (item[3]||'')+' '+
    (item[4]||'')+' '+
    (item[5]||'')+' '+
    (item[6]||'')+' '+
    (item[7]||'')
  );

}

async function obterCacheDaArea(area){

  return await lerAreaOffline(area);

}

export async function listarAreas(){

  try{
    return await sqliteListarAreas();
  }catch(e){
    console.warn('SQLite listarAreas falhou:', e);
    return [];
  }

}

export async function areaOfflineDisponivel(area){

  const cache = await obterCacheDaArea(area);
  return Boolean(cache);

}

export async function listarMRUs(area){

  try{
    return await sqliteListarMRUs(area);
  }catch(e){
    console.warn('SQLite listarMRUs falhou:', e);
  }

  const cache = await obterCacheDaArea(area);
  const dados = obterDadosDaArea(cache);

  const mrus = [...new Set(dados.map(item=>item[0]))];

  mrus.sort();

  return mrus;

}

export async function buscarInstalacoes(area, mru='', texto=''){

  try{
    return await sqliteBuscarInstalacoes(area, mru, texto);
  }catch(e){
    console.warn('SQLite buscarInstalacoes falhou:', e);
  }

  const cache = await obterCacheDaArea(area);

  if(!cache){
    throw new Error('Área não sincronizada offline');
  }

  const dados = obterDadosDaArea(cache);

  const filtroMRU = normalizar(mru);
  const filtroTexto = normalizar(texto);

  return dados.filter(item=>{

    const okMRU =
      !filtroMRU ||
      normalizar(item[0]||'').includes(filtroMRU);

    const okTexto =
      !filtroTexto ||
      textoInstalacao(item).includes(filtroTexto);

    return okMRU && okTexto;

  });

}

export async function listarInstalacoesMapa(area, mru=''){

  try{
    return await sqliteListarInstalacoesMapa(area, mru);
  }catch(e){
    console.warn('SQLite listarInstalacoesMapa falhou:', e);
  }

  const cache = await obterCacheDaArea(area);

  if(!cache){
    throw new Error('Área offline não encontrada');
  }

  const dados = obterDadosDaArea(cache);

  if(!mru){
    return dados;
  }

  return dados.filter(item=>item[0] == mru);

}
