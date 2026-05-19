# Modelos e Campos

## usuario_admin
- `id` INTEGER PK AUTOINCREMENT
- `usuario` TEXT UNIQUE NOT NULL
- `senha_hash` TEXT NOT NULL (PBKDF2)
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `data_update` DATETIME

## profissao
- `id` INTEGER PK AUTOINCREMENT
- `nome` TEXT UNIQUE NOT NULL
- `descricao` TEXT NULL
- `cor` TEXT NOT NULL
- `status` INTEGER NOT NULL DEFAULT 1 (1 ativa, 0 desativada)
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `data_update` DATETIME
- `data_delete` DATETIME NULL
- Regras atuais:
  - desativação usa `status = 0`
  - exclusão administrativa usa remoção física do registro
  - ao excluir uma profissão, denúncias históricas são preservadas e os vínculos dependentes são limpos

## denuncias
- `id` INTEGER PK AUTOINCREMENT
- `protocolo` TEXT UNIQUE NOT NULL
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `regiao` TEXT NOT NULL (legado; não define mais o destinatário)
- `profissao_id` INTEGER NULL (FK `profissao.id`, `ON DELETE SET NULL`)
- `conselho_tutelar_id` INTEGER NULL (FK `conselho_tutelar.id`, `ON DELETE SET NULL`)
- `cidade` TEXT NULL
- `estado` TEXT NULL
- `bairro` TEXT NULL
- Regra de integridade: quando uma profissão é excluída, a denúncia permanece e `profissao_id` vira `NULL`
- Regra de integridade: quando um conselho tutelar é excluído, a denúncia permanece e `conselho_tutelar_id` vira `NULL`
- Regra de envio: o conselho responsável é resolvido por `cidade + estado + bairro`

## documentos
- `id` INTEGER PK AUTOINCREMENT
- `profissao_id` INTEGER NOT NULL (FK `profissao.id`, `ON DELETE CASCADE`)
- `ordem_index` INTEGER NOT NULL
- `titulo` TEXT NOT NULL
- `descricao` TEXT
- `pontos_foco` TEXT
- `url_online` TEXT (opcional; URL para redirecionamento ao conteúdo)
- `arquivo` TEXT (opcional; caminho local do PDF salvo no servidor)
- `foto_capa` TEXT (opcional; caminho local da imagem de capa)
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `data_update` DATETIME
- Regra de negócio: deve existir pelo menos um meio de acesso (`url_online` ou `arquivo`)
- Regra de ordenação: `ordem_index` define a ordem de exibição, deve ser contínuo e único por profissão
- Regra de exclusão: ao excluir a profissão, os registros de documentos são removidos e os arquivos físicos vinculados também devem ser apagados do servidor
- Índice/constraint:
  - `UNIQUE (profissao_id, ordem_index)`
  - `idx_documentos_profissao_ordem (profissao_id, ordem_index)`
- Padrão de armazenamento:
  - Documento: `/data/documento/<profissaoId>_<documentoId>.<ext>`
  - Foto de capa: `/data/fotoDeCapa/<profissaoId>_<documentoId>.<ext>`

## formulario_passo
- `id` INTEGER PK AUTOINCREMENT
- `profissao_id` INTEGER NOT NULL (FK `profissao.id`, `ON DELETE CASCADE`)
- `ordem_index` INTEGER NOT NULL
- `titulo` TEXT NOT NULL
- `descricao` TEXT
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `data_update` DATETIME
- Regra de integridade: ao excluir a profissão, todos os passos vinculados são removidos

## formulario_campo
- `id` INTEGER PK AUTOINCREMENT
- `formulario_passo_id` INTEGER NOT NULL (FK `formulario_passo.id`, `ON DELETE CASCADE`)
- `ordem_index` INTEGER NOT NULL
- `nome` TEXT NOT NULL
- `tipo_campo` TEXT NOT NULL (`texto`, `textarea`, `numero`, `data`, `switch`, `select`, `radio`, `checkbox`, `bairro`, `cep`, `foto`)
- `opcoes` TEXT
- `max_fotos` INTEGER NULL
- `obrigatorio` INTEGER NOT NULL DEFAULT 0
- `dica` TEXT
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `data_update` DATETIME
- Regra de integridade: ao excluir um passo, todos os campos vinculados são removidos
- Regra de dominio: `opcoes` e obrigatoria para `select`, `radio` e `checkbox`
- Regra de dominio: `switch` pode reutilizar `opcoes` de forma opcional; quando presentes, representam uma lista condicional de multipla selecao exibida apenas se a resposta booleana for `sim`
- Regra de dominio: `switch` com `opcoes` deve receber array nao vazio
- Regra de dominio: `opcoes` e proibida para os demais tipos
- Regra de dominio: `max_fotos` e obrigatorio apenas para `tipo_campo = foto`, deve ser inteiro entre `1` e `5` e e proibido para os demais tipos
- Metadado derivado de tipo: `bairro` possui opcoes padrao de dominio e elas nao sao editaveis manualmente no admin
- Metadado derivado de tipo publicado pela API:
  - `modo_opcoes = sempre` para `select`, `radio`, `checkbox`
  - `modo_opcoes = quando_sim` para `switch`
  - `modo_opcoes = nao_se_aplica` para os demais tipos
- Regra de privacidade futura: fotos de denuncias anonimas nao podem ser persistidas em banco nem em disco; quando esse fluxo existir, elas so poderao permanecer em memoria durante a geracao do PDF enviado por email

## conselho_tutelar
- `id` INTEGER PK AUTOINCREMENT
- `nome` TEXT NOT NULL
- `email` TEXT NOT NULL
- `cidade` TEXT NOT NULL
- `estado` TEXT NOT NULL
- `bairros` TEXT NOT NULL (JSON string com `string[]`)
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `data_update` DATETIME
- Índice/constraint:
  - `UNIQUE (nome, cidade, estado)`
  - `idx_conselho_tutelar_cidade_estado (cidade, estado)`
- Seed inicial: quando a tabela está vazia, importar `src/features/conselho-tutelar/data/conselhos-cg.json`
- Regra de domínio: dentro da mesma `cidade + estado`, um bairro só pode pertencer a um conselho

## Tipos auxiliares (runtime)
- DTOs de profissão:  
  - Criar: `nome`, `descricao`, `cor`, `status?`  
  - Atualizar: `nome?`, `descricao?`, `cor?`, `status?`  
  - Alterar status: `status` (0/1)
  - Remover: `DELETE /api/profissoes/:id`
- DTOs de documento:
  - Criar (multipart/form-data): `profissao_id`, `ordem_index?`, `titulo`, `descricao?`, `pontos_foco?`, `url_online?`, `arquivo?`, `foto_capa?`
  - Atualizar (multipart/form-data): `profissao_id?`, `ordem_index?`, `titulo?`, `descricao?`, `pontos_foco?`, `url_online?`, `arquivo?`, `foto_capa?`
  - Reordenar (JSON): `profissao_id`, `itens: [{ id, ordem_index }]`
- DTOs de conselho tutelar:
  - Criar: `nome`, `email`, `cidade`, `estado`, `bairros`
  - Remover: `DELETE /api/conselhos-tutelares/:id`
- DTO de denúncia:
  - Criar (multipart/form-data): `profissao_id`, `cidade`, `estado`, `bairro`, `regiao?`, `pdf`
- Login: `usuario`, `senha`
