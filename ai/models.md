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
- `descricao` TEXT NOT NULL
- `cor` TEXT NOT NULL
- `status` INTEGER NOT NULL DEFAULT 1 (1 ativa, 0 desativada)
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `data_update` DATETIME
- `data_delete` DATETIME (soft delete; linhas com valor não são listadas)

## denuncias
- `id` INTEGER PK AUTOINCREMENT
- `protocolo` TEXT UNIQUE NOT NULL
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `regiao` TEXT NOT NULL
- `profissao_id` INTEGER NULL (FK profissao)

## documentos
- `id` INTEGER PK AUTOINCREMENT
- `profissao_id` INTEGER NOT NULL (FK profissao)
- `titulo` TEXT NOT NULL
- `descricao` TEXT
- `pontos_foco` TEXT
- `url_online` TEXT (opcional; URL para redirecionamento ao conteúdo)
- `arquivo` TEXT (opcional; caminho local do PDF salvo no servidor)
- `foto_capa` TEXT (opcional; caminho local da imagem de capa)
- `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP
- `data_update` DATETIME
- Regra de negócio: deve existir pelo menos um meio de acesso (`url_online` ou `arquivo`)
- Padrão de armazenamento:
  - Documento: `/data/documento/<profissaoId>_<documentoId>.<ext>`
  - Foto de capa: `/data/fotoDeCapa/<profissaoId>_<documentoId>.<ext>`

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
- DTOs de documento:
  - Criar (multipart/form-data): `profissao_id`, `titulo`, `descricao?`, `pontos_foco?`, `url_online?`, `arquivo?`, `foto_capa?`
  - Atualizar (multipart/form-data): `profissao_id?`, `titulo?`, `descricao?`, `pontos_foco?`, `url_online?`, `arquivo?`, `foto_capa?`
- Login: `usuario`, `senha`
