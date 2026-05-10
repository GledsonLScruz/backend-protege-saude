# Plano de Integração: Ordem dos Documentos Norteadores

## Objetivo

Atualizar os sistemas que consomem este backend para suportar ordenação explícita dos documentos norteadores por `ordem_index`.

## Sistemas impactados

- Admin/console que cria, edita, lista e reordena documentos norteadores.
- Site/app público que exibe documentos norteadores por profissão.
- Qualquer cliente que consuma `GET /api/profissoes/:profissaoId/documentos`, `POST /api/documentos` ou `PUT /api/documentos/:id`.

## Contrato atualizado

### Documento

As respostas de documento passam a incluir:

```json
{
  "id": 1,
  "profissao_id": 2,
  "ordem_index": 1,
  "titulo": "Documento",
  "descricao": null,
  "pontos_foco": null,
  "url_online": "https://exemplo.com/documento.pdf",
  "arquivo": null,
  "foto_capa": null,
  "data_criacao": "2026-05-10 13:00:00",
  "data_update": null
}
```

### Listagem

`GET /api/profissoes/:profissaoId/documentos`

- Retorna documentos já ordenados por `ordem_index` crescente.
- Clientes não devem mais ordenar por `data_criacao`.
- Clientes podem usar `ordem_index` para renderizar posição visual ou controles de ordenação.

### Criação

`POST /api/documentos`

Campo novo no `multipart/form-data`:

- `ordem_index?`: número inteiro positivo.

Comportamento:

- Se `ordem_index` não for enviado, o backend atribui a próxima posição da profissão.
- Se `ordem_index` já existir na mesma profissão, o backend retorna `409`.
- As demais regras de upload, URL, PDF e foto de capa continuam iguais.

### Atualização

`PUT /api/documentos/:id`

Campo novo no `multipart/form-data`:

- `ordem_index?`: número inteiro positivo.

Comportamento:

- Se enviado, altera a posição do documento dentro da profissão.
- Se duplicar a ordem de outro documento da mesma profissão, o backend retorna `409`.
- Se o documento for movido para outra profissão sem informar `ordem_index`, o backend atribui a próxima posição da nova profissão.

### Reordenação em lote

Novo endpoint:

`PATCH /api/documentos/reorder`

Autenticação:

- Requer `Authorization: Bearer <token JWT>`.

Request:

```json
{
  "profissao_id": 2,
  "itens": [
    { "id": 10, "ordem_index": 1 },
    { "id": 11, "ordem_index": 2 },
    { "id": 12, "ordem_index": 3 }
  ]
}
```

Response `200`:

- Lista `Documento[]` da profissão já reordenada.

Validações:

- `profissao_id` deve existir.
- `itens` deve incluir todos os documentos da profissão e apenas eles.
- `id` não pode repetir.
- `ordem_index` não pode repetir.
- `ordem_index` deve ser sequencial iniciando em `1`.

Erros esperados:

- `400`: payload inválido, ordem não sequencial ou lista incompleta.
- `404`: profissão não encontrada.
- `409`: ids ou ordens duplicadas.

## Alterações necessárias no Admin

- Incluir `ordem_index` no tipo/interface de `Documento`.
- Garantir que a listagem use a ordem retornada pela API.
- Em criação, permitir omitir `ordem_index` para inserir no final.
- Em edição, tratar conflito `409` quando a ordem já estiver ocupada.
- Implementar ação de reordenar chamando `PATCH /api/documentos/reorder`.
- Ao reordenar via drag-and-drop ou botões de subir/descer, enviar todos os documentos da profissão com `ordem_index` sequencial a partir de `1`.
- Após salvar reorder, substituir o estado local pela lista retornada pelo backend.

## Alterações necessárias no site/app público

- Incluir `ordem_index` no tipo/interface de `Documento`, se houver tipagem local.
- Remover ordenações locais por data de criação.
- Exibir documentos na ordem retornada por `GET /api/profissoes/:profissaoId/documentos`.
- Não chamar endpoints autenticados de criação, edição ou reorder.

## Compatibilidade

- Clientes antigos que apenas listam documentos continuam recebendo a lista, mas a ordem muda de `data_criacao DESC` para `ordem_index ASC`.
- Clientes que validam tipos estritos precisam adicionar `ordem_index`.
- O campo `ordem_index` é obrigatório nas respostas, mas opcional em criação e atualização.

## Checklist de implementação

- [ ] Atualizar tipos/interfaces de documento nos clientes.
- [ ] Ajustar camada de API/client SDK para aceitar `ordem_index`.
- [ ] Remover ordenação local por `data_criacao` na exibição.
- [ ] Implementar fluxo de reorder no admin.
- [ ] Tratar erros `400`, `404` e `409` nos formulários do admin.
- [ ] Validar que criação sem `ordem_index` adiciona documento ao final.
- [ ] Validar que reorder envia todos os documentos da profissão.
- [ ] Validar que o site/app público respeita a nova ordem.
