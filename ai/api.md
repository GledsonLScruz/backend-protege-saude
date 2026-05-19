# APIs Disponíveis

# Rotas marcadas com "*necessário autenticação" são utilizadas pelo console administrador da plataforma e exigem header `Authorization: Bearer <token JWT>`.

## Autenticação
- `POST /api/auth/login`  
  **Request (JSON):** `{ "usuario": string, "senha": string }`  
  **Validações:** campos obrigatórios (trim); credenciais conferidas no banco (PBKDF2).  
  **Response 200:** `{ "message": "Autenticado com sucesso", "usuario": { "id": number, "usuario": string }, "accessToken": string, "refreshToken": string }`  
  **Erros:** 400 se faltar usuário/senha; 401 se credenciais inválidas; 500 falha interna.
- `POST /api/auth/refresh`  
  **Request (JSON):** `{ "refreshToken": string }`  
  **Validações:** refresh obrigatório; verificação de assinatura e expiração; precisa coincidir com hash salvo no usuário.  
  **Response 200:** `{ "message": "Tokens renovados com sucesso", "usuario": { "id": number, "usuario": string }, "accessToken": string, "refreshToken": string }`  
  **Erros:** 400 se ausente; 401 se expirado/inválido/não reconhecido.

## Profissões
- `GET /api/profissoes`  
  **Response 200:** lista `Profissao[]` (`id, nome, descricao, cor, status, data_criacao, data_update, data_delete`).
- `POST /api/profissoes`  *necessário autenticação*  
  **Request (JSON):** `{ "nome": string, "descricao": string, "cor": string, "status"?: 0|1 }`  
  **Validações:** nome/descrição/cor obrigatórios; `status` apenas 0 ou 1; 409 se nome já existir.  
  **Response 201:** `Profissao` criada.  
  **Erros:** 400 validação; 409 duplicidade.
- `PUT /api/profissoes/:id`  *necessário autenticação*  
  **Params:** `id` numérico.  
  **Request (JSON):** campos opcionais `nome`, `descricao`, `cor`, `status` (0|1).  
  **Validações:** `id` numérico; `status` só 0 ou 1; 404 se não encontrada; 409 se nome duplicado.  
  **Response 200:** `Profissao` atualizada.  
  **Erros:** 400 validação; 404 não encontrada; 409 duplicidade.
- `DELETE /api/profissoes/:id`  *necessário autenticação*  
  **Params:** `id` numérico.  
  **Validações:** `id` obrigatório e numérico; 404 se profissão não encontrada.  
  **Regras de negócio:** antes de remover a profissão, o backend limpa `denuncias.profissao_id` para `NULL`, remove os documentos da profissão e apaga os arquivos físicos associados. Passos e campos de formulário ligados à profissão são removidos por cascade.  
  **Response 200:** `{ "message": "Profissão removida com sucesso" }`.  
  **Erros:** 400 validação; 404 não encontrada; 500 falha durante a remoção.
- `PATCH /api/profissoes/:id/status`  *necessário autenticação*  
  **Params:** `id` numérico.  
  **Request (JSON):** `{ "status": 0|1 }`  
  **Validações:** `id` numérico; status precisa ser 0 ou 1; 404 se não encontrada.  
  **Response 200:** `Profissao` com status atualizado.  
  **Erros:** 400 validação; 404 não encontrada.

## Documentos
- `GET /api/profissoes/:profissaoId/documentos`  
  **Params:** `profissaoId` numérico.  
  **Validações:** `profissaoId` obrigatório e numérico; 404 se profissão não encontrada.  
  **Response 200:** lista `Documento[]` da profissão ordenada por `ordem_index` (`id, profissao_id, ordem_index, titulo, descricao, pontos_foco, url_online, arquivo, foto_capa, data_criacao, data_update`).
- `GET /api/documentos/:id`  
  **Params:** `id` numérico.  
  **Validações:** `id` obrigatório e numérico; 404 se documento não encontrado.  
  **Response 200:** `Documento` por id.
- `POST /api/documentos`  *necessário autenticação*  
  **Request (multipart/form-data):** `profissao_id` (number), `ordem_index?` (number), `titulo` (string), `descricao?` (string), `pontos_foco?` (string), `url_online?` (string URL), `arquivo?` (file PDF), `foto_capa?` (image).  
  **Validações:** `profissao_id` e `titulo` obrigatórios; `profissao_id` deve existir; `ordem_index` deve ser inteiro positivo e único por profissão quando enviado; se ausente, recebe a próxima ordem da profissão; pelo menos um meio de acesso entre `url_online` e `arquivo`; `arquivo` apenas PDF; `foto_capa` opcional com mime de imagem; `url_online` deve ser URL válida quando enviada.  
  **Regras de arquivo:** após gerar `documentoId`, salvar:
  - documento em `/data/documento/<profissaoId>_<documentoId>.<ext>`
  - foto de capa em `/data/fotoDeCapa/<profissaoId>_<documentoId>.<ext>`
  **Response 201:** `Documento` criado.
  **Erros:** 400 validação; 404 profissão não encontrada; 409 ordem duplicada; 415 tipo de arquivo inválido.
- `PUT /api/documentos/:id`  *necessário autenticação*  
  **Params:** `id` numérico.  
  **Request (multipart/form-data):** campos opcionais `profissao_id`, `ordem_index`, `titulo`, `descricao`, `pontos_foco`, `url_online`, `arquivo`, `foto_capa`, `remover_arquivo` (boolean), `remover_foto_capa` (boolean).  
  **Validações:** `id` numérico; 404 se documento não encontrado; se atualizar `profissao_id`, a profissão precisa existir; `ordem_index` deve ser inteiro positivo e único por profissão quando enviado; ao mover para outra profissão sem `ordem_index`, recebe a próxima ordem da nova profissão; manter regra de pelo menos um meio de acesso (`url_online` ou `arquivo`) após a atualização; `arquivo` apenas PDF; `foto_capa` apenas imagem; não é permitido enviar `arquivo` junto com `remover_arquivo=true`; não é permitido enviar `foto_capa` junto com `remover_foto_capa=true`.  
  **Regras de arquivo:** se enviar novo arquivo/capa, sobrescrever caminho no padrão `<profissaoId>_<documentoId>.<ext>` nos diretórios definidos.  
  **Remoção de anexos:** `remover_arquivo=true` remove o PDF existente e limpa o campo `arquivo`; `remover_foto_capa=true` remove a imagem existente e limpa o campo `foto_capa`.  
  **Response 200:** `Documento` atualizado.
  **Erros:** 400 validação; 404 não encontrado; 409 ordem duplicada; 415 tipo de arquivo inválido.
- `PATCH /api/documentos/reorder`  *necessário autenticação*  
  **Request (JSON):** `{ "profissao_id": number, "itens": [{ "id": number, "ordem_index": number }] }`  
  **Validações:** profissão existente; `itens` obrigatório; ids e ordens sem duplicidade; `ordem_index` sequencial iniciando em 1; deve incluir todos os documentos da profissão e apenas eles.  
  **Response 200:** lista `Documento[]` da profissão já reordenada.  
  **Erros:** 400 validação; 404 profissão não encontrada; 409 duplicidade.
- `DELETE /api/documentos/:id`  *necessário autenticação*  
  **Params:** `id` numérico.  
  **Validações:** `id` obrigatório e numérico; 404 se documento não encontrado.  
  **Response 200:** `{ "message": "Documento removido com sucesso" }`.  
  **Erros:** 400 validação; 404 não encontrado.

## Denúncias
- `POST /api/denuncia`
  **Request (FormData):** `profissao_id` (number), `cidade` (string), `estado` (string), `bairro` (string), `regiao?` (`norte|sul|leste|oeste`, legado), arquivo `pdf` obrigatório (`pdf`).
  **Validações:** profissão obrigatória, existente e ativa; `cidade`, `estado` e `bairro` obrigatórios; deve existir Conselho Tutelar cadastrado para a combinação `cidade + estado + bairro`; serviço gera protocolo e envia e-mail para o `email` do conselho encontrado.
  **Response 201:** `{ "message": "Denúncia enviada com sucesso.", "protocolo": string }`
  **Erros:** 400 validação; 404 profissão ou conselho não encontrado; 500 falha ao enviar/registrar denúncia.
- `GET /api/relatorio-denuncia`
  **Response 200:** lista de denúncias `[{ id, protocolo, data_criacao, regiao, profissao_id?, conselho_tutelar_id?, cidade?, estado?, bairro? }]` ordenada por data de criação desc.
  **Observação:** após a exclusão de uma profissão, denúncias históricas permanecem na listagem com `profissao_id = null`.

## Conselhos Tutelares
- `GET /api/conselhos-tutelares`
  **Response 200:** lista completa de conselhos tutelares dinâmicos (`id, nome, email, cidade, estado, bairros, data_criacao, data_update`).
- `GET /api/conselhos-tutelares/search?termo=`
  **Query:** `termo` (string) obrigatório.
  **Validações:** 400 se termo ausente ou vazio.
  **Response 200:** conselhos filtrados por nome, cidade, estado, e-mail ou bairros.
- `GET /api/conselhos-tutelares/:id`
  **Params:** `id` numérico.
  **Response 200:** conselho pelo id.
  **Erros:** 404 se não encontrado.
- `GET /api/conselhos-tutelares/cidade/:cidade`
  **Params:** `cidade` string.
  **Response 200:** conselho da cidade exata.
  **Erros:** 404 se não encontrado.
- `POST /api/conselhos-tutelares`  *necessário autenticação*
  **Request (JSON):** `{ "nome": string, "email": string, "cidade": string, "estado": string, "bairros": string[] }`
  **Validações:** `nome`, `email`, `cidade` e `estado` obrigatórios; `email` válido; `bairros` deve ser array; bairros não podem repetir dentro do mesmo conselho; um bairro não pode estar vinculado a outro conselho da mesma cidade/estado.
  **Response 201:** `ConselhoTutelar` criado.
  **Erros:** 400 validação; 409 duplicidade.
- `PUT /api/conselhos-tutelares/:id`  *necessário autenticação*
  **Params:** `id` numérico.
  **Request (JSON):** `{ "nome": string, "email": string, "cidade": string, "estado": string, "bairros": string[] }`
  **Validações:** `id` numérico; `nome`, `email`, `cidade` e `estado` obrigatórios; `email` válido; `bairros` deve ser array; bairros não podem repetir dentro do mesmo conselho; um bairro não pode estar vinculado a outro conselho da mesma cidade/estado, ignorando o próprio conselho editado.
  **Response 200:** `ConselhoTutelar` atualizado.
  **Erros:** 400 validação; 404 não encontrado; 409 duplicidade.
- `DELETE /api/conselhos-tutelares/:id`  *necessário autenticação*
  **Params:** `id` numérico.
  **Response 200:** `{ "message": "Conselho tutelar removido com sucesso" }`.
  **Erros:** 400 validação; 404 não encontrado.
