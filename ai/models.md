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
- `regiao` TEXT NOT NULL
- `profissao_id` INTEGER NULL (FK `profissao.id`, `ON DELETE SET NULL`)
- Regra de integridade: quando uma profissão é excluída, a denúncia permanece e `profissao_id` vira `NULL`

## documentos
- `id` INTEGER PK AUTOINCREMENT
- `profissao_id` INTEGER NOT NULL (FK `profissao.id`, `ON DELETE CASCADE`)
- `titulo` TEXT NOT NULL
- `descricao` TEXT
- `pontos_foco` TEXT
- `url_online` TEXT (opcional; URL para redirecionamento ao conteúdo)
- `arquivo` TEXT (opcional; caminho local do PDF salvo no servidor)
- `foto_capa` TEXT (opcional; caminho local da imagem de capa)
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `data_update` DATETIME
- Regra de negócio: deve existir pelo menos um meio de acesso (`url_online` ou `arquivo`)
- Regra de exclusão: ao excluir a profissão, os registros de documentos são removidos e os arquivos físicos vinculados também devem ser apagados do servidor
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
- Regra de dominio: `opcoes` so e permitida para `select`, `radio` e `checkbox`
- Regra de dominio: `max_fotos` e obrigatorio apenas para `tipo_campo = foto`, deve ser inteiro entre `1` e `5` e e proibido para os demais tipos
- Metadado derivado de tipo: `bairro` possui opcoes padrao de dominio e elas nao sao editaveis manualmente no admin
- Regra de privacidade futura: fotos de denuncias anonimas nao podem ser persistidas em banco nem em disco; quando esse fluxo existir, elas so poderao permanecer em memoria durante a geracao do PDF enviado por email

## conselho_tutelar (carga estática em JSON)
- `id` INTEGER
- `cidade` TEXT
- `endereco` TEXT
- `emails` TEXT[] (armazenado no JSON)
- `conselhoDireito` TEXT
- `conselhoTutelar` TEXT
- `conselhosRegionais`/`subconselhos` opcionais no JSON

## Tipos auxiliares (runtime)
- DTOs de profissão:  
  - Criar: `nome`, `descricao`, `cor`, `status?`  
  - Atualizar: `nome?`, `descricao?`, `cor?`, `status?`  
  - Alterar status: `status` (0/1)
  - Remover: `DELETE /api/profissoes/:id`
- DTOs de documento:
  - Criar (multipart/form-data): `profissao_id`, `titulo`, `descricao?`, `pontos_foco?`, `url_online?`, `arquivo?`, `foto_capa?`
  - Atualizar (multipart/form-data): `profissao_id?`, `titulo?`, `descricao?`, `pontos_foco?`, `url_online?`, `arquivo?`, `foto_capa?`
- Login: `usuario`, `senha`
