import csv
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "csv" / "instalacoes.csv"
DB_PATH = ROOT / "database" / "rotaleitura.db"

CAMPOS = [
    "area",
    "mru",
    "instalacao",
    "medidor",
    "rua",
    "numero",
    "bairro",
    "local",
    "latitude",
    "longitude",
]

CAMPOS_REMOVIDOS = {
    "pesquisa",
    "rota",
    "linkmapa",
}


def normalizar_campo(nome):
    return (
        str(nome or "")
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
    )


def detectar_delimitador(amostra):
    try:
        return csv.Sniffer().sniff(amostra, delimiters=",;|\t").delimiter
    except csv.Error:
        return ","


def parece_cabecalho(linha):
    nomes = {normalizar_campo(coluna) for coluna in linha}
    return bool(nomes & (set(CAMPOS) | CAMPOS_REMOVIDOS))


def ler_registros():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV não encontrado: {CSV_PATH}")

    conteudo = CSV_PATH.read_text(encoding="utf-8-sig")

    if not conteudo.strip():
        return []

    delimitador = detectar_delimitador(conteudo[:4096])
    linhas = list(csv.reader(conteudo.splitlines(), delimiter=delimitador))

    if not linhas:
        return []

    primeira_linha = linhas[0]

    if parece_cabecalho(primeira_linha):
        cabecalho = [normalizar_campo(coluna) for coluna in primeira_linha]
        dados = linhas[1:]
    else:
        cabecalho = [
            "mru",
            "instalacao",
            "medidor",
            "rua",
            "numero",
            "bairro",
            "local",
            "latitude",
            "longitude",
            "linkmapa",
        ]
        dados = linhas

    registros = []

    for linha in dados:
        origem = {
            cabecalho[indice]: valor.strip()
            for indice, valor in enumerate(linha)
            if indice < len(cabecalho)
        }

        registro = {campo: origem.get(campo, "") for campo in CAMPOS}

        if not registro["area"]:
            registro["area"] = registro["mru"][:3]

        if registro["instalacao"]:
            registros.append(registro)

    return registros


def criar_tabela(conexao):
    conexao.execute(
        """
        CREATE TABLE IF NOT EXISTS instalacoes (
            area TEXT,
            mru TEXT,
            instalacao TEXT PRIMARY KEY,
            medidor TEXT,
            rua TEXT,
            numero TEXT,
            bairro TEXT,
            local TEXT,
            latitude REAL,
            longitude REAL
        )
        """
    )


def buscar_instalacao(conexao, instalacao):
    cursor = conexao.execute(
        """
        SELECT
            area,
            mru,
            instalacao,
            medidor,
            rua,
            numero,
            bairro,
            local,
            latitude,
            longitude
        FROM instalacoes
        WHERE instalacao = ?
        """,
        (instalacao,),
    )

    linha = cursor.fetchone()

    if not linha:
        return None

    return dict(zip(CAMPOS, linha))


def normalizar_valor(valor):
    if valor is None:
        return ""

    return str(valor).strip()


def registros_diferentes(atual, novo):
    for campo in CAMPOS:
        if normalizar_valor(atual.get(campo)) != normalizar_valor(novo.get(campo)):
            return True

    return False


def inserir_registro(conexao, registro):
    conexao.execute(
        """
        INSERT INTO instalacoes (
            area,
            mru,
            instalacao,
            medidor,
            rua,
            numero,
            bairro,
            local,
            latitude,
            longitude
        )
        VALUES (
            :area,
            :mru,
            :instalacao,
            :medidor,
            :rua,
            :numero,
            :bairro,
            :local,
            :latitude,
            :longitude
        )
        """,
        registro,
    )


def atualizar_registro(conexao, registro):
    conexao.execute(
        """
        UPDATE instalacoes
        SET
            area = :area,
            mru = :mru,
            medidor = :medidor,
            rua = :rua,
            numero = :numero,
            bairro = :bairro,
            local = :local,
            latitude = :latitude,
            longitude = :longitude
        WHERE instalacao = :instalacao
        """,
        registro,
    )


def importar_registros(conexao, registros):
    relatorio = {
        "novas": [],
        "atualizadas": [],
        "ignoradas": [],
    }

    for registro in registros:
        atual = buscar_instalacao(conexao, registro["instalacao"])

        if not atual:
            inserir_registro(conexao, registro)
            relatorio["novas"].append(registro["instalacao"])
            continue

        if registros_diferentes(atual, registro):
            atualizar_registro(conexao, registro)
            relatorio["atualizadas"].append(registro["instalacao"])
            continue

        relatorio["ignoradas"].append(registro["instalacao"])

    return relatorio


def main():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    registros = ler_registros()

    with sqlite3.connect(DB_PATH) as conexao:
        criar_tabela(conexao)
        relatorio = importar_registros(conexao, registros)
        conexao.commit()

    print(f"Banco atualizado: {DB_PATH}")
    print(f"Novas instala??es: {len(relatorio['novas'])}")
    print(f"Instala??es atualizadas: {len(relatorio['atualizadas'])}")
    print(f"Instala??es ignoradas: {len(relatorio['ignoradas'])}")

    if relatorio["novas"]:
        print("\nNovas instala??es:")
        for instalacao in relatorio["novas"]:
            print(f"- {instalacao}")

    if relatorio["atualizadas"]:
        print("\nInstala??es atualizadas:")
        for instalacao in relatorio["atualizadas"]:
            print(f"- {instalacao}")


if __name__ == "__main__":
    main()
