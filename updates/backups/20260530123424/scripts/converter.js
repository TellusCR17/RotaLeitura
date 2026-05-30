const fs = require('fs');

const LIMITE_POR_ARQUIVO = 5000;

const csv = fs.readFileSync('./csv/resumo.csv', 'utf8');

const linhas = csv
  .split('\n')
  .filter(l => l.trim() !== '');

linhas.shift();

const areas = {};
const indexes = {};

for (const linha of linhas) {

  const colunas = linha.split(',');

  const item = [
    colunas[0] || '',
    colunas[1] || '',
    colunas[2] || '',
    colunas[3] || '',
    colunas[4] || '',
    colunas[5] || '',
    colunas[6] || '',
    colunas[7] || '',
    colunas[8] || '',
    colunas[9] || '',
    colunas[10] || ''
  ];

  const area = String(colunas[0]).substring(0,3);

  if (!areas[area]) {
    areas[area] = [];
  }

  areas[area].push(item);

}

if (!fs.existsSync('./json')) {
  fs.mkdirSync('./json');
}

/* LIMPAR JSONS ANTIGOS */

const arquivosAntigos = fs.readdirSync('./json');

for (const arquivo of arquivosAntigos) {
  fs.unlinkSync('./json/' + arquivo);
}

/* GERAR NOVOS */

for (const area in areas) {

  indexes[area] = [];

  const registros = areas[area];

  let contador = 1;

  for (let i = 0; i < registros.length; i += LIMITE_POR_ARQUIVO) {

    const parte = registros.slice(i, i + LIMITE_POR_ARQUIVO);

    const nomeArquivo = `${area}_${contador}.json`;

    fs.writeFileSync(
      `./json/${nomeArquivo}`,
      JSON.stringify(parte)
    );

    indexes[area].push(`json/${nomeArquivo}`);

    contador++;

  }

}

/* GERAR INDEXES */

fs.writeFileSync(
  './indexes.json',
  JSON.stringify(indexes, null, 2)
);

console.log('Conversão concluída.');
