import { normalizar } from '../utils/normalizar.js';

const SQL_JS_SCRIPT = 'https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.js';
const SQL_JS_WASM = 'https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.wasm';

let dbPromise = null;
let sqlJsPromise = null;

function gerarLinkGoogleMaps(latitude, longitude) {
  const lat = String(latitude || '').trim();
  const lng = String(longitude || '').trim();

  if (!lat || !lng) {
    return '#';
  }

  const latFloat = parseFloat(lat);
  const lngFloat = parseFloat(lng);

  if (Number.isNaN(latFloat) || Number.isNaN(lngFloat)) {
    return '#';
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(latFloat)},${encodeURIComponent(lngFloat)}`;
}

function converterRegistroParaArray(row) {
  return [
    row.mru || '',
    row.instalacao || '',
    row.medidor || '',
    row.rua || '',
    row.numero || '',
    row.bairro || '',
    row.local || '',
    row.cliente || '',
    row.latitude != null ? String(row.latitude) : '',
    row.longitude != null ? String(row.longitude) : '',
    gerarLinkGoogleMaps(row.latitude, row.longitude)
  ];
}

function resultadoSqlParaLinhas(resultado) {
  if (!resultado || resultado.length === 0) {
    return [];
  }

  const { columns, values } = resultado[0];

  return values.map(rowValues => {
    const row = {};

    columns.forEach((col, index) => {
      row[col] = rowValues[index];
    });

    return row;
  });
}

async function carregarSqlJs() {
  if (window.initSqlJs) {
    return window.initSqlJs;
  }

  if (sqlJsPromise) {
    return sqlJsPromise;
  }

  sqlJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src = SQL_JS_SCRIPT;
    script.async = true;

    script.onload = () => {
      const initSqlJs = window.initSqlJs;

      if (typeof initSqlJs !== 'function') {
        reject(new Error('sql.js carregado, mas initSqlJs não foi encontrado'));
        return;
      }

      resolve(initSqlJs);
    };

    script.onerror = () => {
      reject(new Error('Falha ao carregar sql.js'));
    };

    document.head.appendChild(script);
  });

  return sqlJsPromise;
}

async function abrirDatabase() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    const initSqlJs = await carregarSqlJs();
    const SQL = await initSqlJs({ locateFile: () => SQL_JS_WASM });

    const response = await fetch('./database/rotaleitura.db');

    if (!response.ok) {
      throw new Error('Falha ao carregar database/rotaleitura.db');
    }

    const buffer = await response.arrayBuffer();
    return new SQL.Database(new Uint8Array(buffer));
  })();

  return dbPromise;
}

async function executarConsulta(sql, parametros = []) {
  const db = await abrirDatabase();
  const resultado = db.exec(sql, parametros);
  return resultadoSqlParaLinhas(resultado);
}

function criarTextoInstalacao(item) {
  return normalizar(
    (item[0] || '') + ' ' +
    (item[1] || '') + ' ' +
    (item[2] || '') + ' ' +
    (item[3] || '') + ' ' +
    (item[4] || '') + ' ' +
    (item[5] || '') + ' ' +
    (item[6] || '') + ' ' +
    (item[7] || '')
  );
}

export async function listarAreas() {
  const linhas = await executarConsulta(
    'SELECT DISTINCT area FROM instalacoes ORDER BY area'
  );

  return linhas.map(linha => linha.area || '').filter(area => area);
}

export async function listarMRUs(area) {
  if (!area) {
    return [];
  }

  const linhas = await executarConsulta(
    'SELECT DISTINCT mru FROM instalacoes WHERE area = ? ORDER BY mru',
    [area]
  );

  return linhas.map(linha => linha.mru || '').filter(mru => mru);
}

export async function buscarInstalacoes(area, mru = '', texto = '') {
  if (!area) {
    return [];
  }

  let sql = 'SELECT * FROM instalacoes WHERE area = ?';
  const parametros = [area];

  if (mru) {
    sql += ' AND mru = ?';
    parametros.push(mru);
  }

  sql += ' ORDER BY mru, instalacao';

  const linhas = await executarConsulta(sql, parametros);
  const registros = linhas.map(converterRegistroParaArray);

  if (!texto) {
    return registros;
  }

  const filtroTexto = normalizar(texto);

  return registros.filter(item => {
    return criarTextoInstalacao(item).includes(filtroTexto);
  });
}

export async function listarInstalacoesMapa(area, mru = '') {
  if (!area) {
    return [];
  }

  const sql = mru
    ? 'SELECT * FROM instalacoes WHERE area = ? AND mru = ? ORDER BY instalacao'
    : 'SELECT * FROM instalacoes WHERE area = ? ORDER BY instalacao';

  const parametros = mru ? [area, mru] : [area];

  const linhas = await executarConsulta(sql, parametros);
  return linhas.map(converterRegistroParaArray);
}
