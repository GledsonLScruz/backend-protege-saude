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
  **Response 200:** lista `Documento[]` da profissão (`id, profissao_id, titulo, descricao, pontos_foco, url_online, arquivo, foto_capa, data_criacao, data_update`).
- `GET /api/documentos/:id`  
  **Params:** `id` numérico.  
  **Validações:** `id` obrigatório e numérico; 404 se documento não encontrado.  
  **Response 200:** `Documento` por id.
- `POST /api/documentos`  *necessário autenticação*  
  **Request (multipart/form-data):** `profissao_id` (number), `titulo` (string), `descricao?` (string), `pontos_foco?` (string), `url_online?` (string URL), `arquivo?` (file PDF), `foto_capa?` (image).  
  **Validações:** `profissao_id` e `titulo` obrigatórios; `profissao_id` deve existir; pelo menos um meio de acesso entre `url_online` e `arquivo`; `arquivo` apenas PDF; `foto_capa` opcional com mime de imagem; `url_online` deve ser URL válida quando enviada.  
  **Regras de arquivo:** após gerar `documentoId`, salvar:
  - documento em `/data/documento/<profissaoId>_<documentoId>.<ext>`
  - foto de capa em `/data/fotoDeCapa/<profissaoId>_<documentoId>.<ext>`
  **Response 201:** `Documento` criado.
  **Erros:** 400 validação; 404 profissão não encontrada; 415 tipo de arquivo inválido.
- `PUT /api/documentos/:id`  *necessário autenticação*  
  **Params:** `id` numérico.  
  **Request (multipart/form-data):** campos opcionais `profissao_id`, `titulo`, `descricao`, `pontos_foco`, `url_online`, `arquivo`, `foto_capa`, `remover_arquivo` (boolean), `remover_foto_capa` (boolean).  
  **Validações:** `id` numérico; 404 se documento não encontrado; se atualizar `profissao_id`, a profissão precisa existir; manter regra de pelo menos um meio de acesso (`url_online` ou `arquivo`) após a atualização; `arquivo` apenas PDF; `foto_capa` apenas imagem; não é permitido enviar `arquivo` junto com `remover_arquivo=true`; não é permitido enviar `foto_capa` junto com `remover_foto_capa=true`.  
  **Regras de arquivo:** se enviar novo arquivo/capa, sobrescrever caminho no padrão `<profissaoId>_<documentoId>.<ext>` nos diretórios definidos.  
  **Remoção de anexos:** `remover_arquivo=true` remove o PDF existente e limpa o campo `arquivo`; `remover_foto_capa=true` remove a imagem existente e limpa o campo `foto_capa`.  
  **Response 200:** `Documento` atualizado.
  **Erros:** 400 validação; 404 não encontrado; 415 tipo de arquivo inválido.
- `DELETE /api/documentos/:id`  *necessário autenticação*  
  **Params:** `id` numérico.  
  **Validações:** `id` obrigatório e numérico; 404 se documento não encontrado.  
  **Response 200:** `{ "message": "Documento removido com sucesso" }`.  
  **Erros:** 400 validação; 404 não encontrado.

## Denúncias
- `POST /api/denuncia`  
  **Request (FormData):** campo `regiao` obrigatório (`norte|sul|leste|oeste`); arquivo `pdf` opcional (`pdf`).  
  **Validações:** `regiao` obrigatório (400 se ausente); serviço gera protocolo e envia e-mail para a região.  
  **Response 201:** `{ "message": "Denúncia enviada com sucesso.", "protocolo": string }`  
  **Erros:** 500 falha ao enviar/registrar denúncia.
- `GET /api/relatorio-denuncia`  
  **Response 200:** lista de denúncias `[{ id, protocolo, data_criacao, regiao }]` ordenada por data de criação desc.

## Conselhos Tutelares
- `GET /api/conselhos-tutelares`  
  **Response 200:** lista completa de conselhos tutelares.
- `GET /api/conselhos-tutelares/search?termo=`  
  **Query:** `termo` (string) obrigatório.  
  **Validações:** 400 se termo ausente ou vazio.  
  **Response 200:** conselhos filtrados por cidade ou e-mail.
- `GET /api/conselhos-tutelares/:id`  
  **Params:** `id` numérico.  
  **Response 200:** conselho pelo id.  
  **Erros:** 404 se não encontrado.
- `GET /api/conselhos-tutelares/cidade/:cidade`  
  **Params:** `cidade` string.  
  **Response 200:** conselho da cidade exata.  
  **Erros:** 404 se não encontrado.
