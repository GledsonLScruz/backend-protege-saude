# API Contract - Formulario Passos e Campos

## Passos

- `GET /api/profissoes/:profissaoId/formulario-passos`
  - Lista os passos da profissao ordenados por `ordem_index`.

- `POST /api/profissoes/:profissaoId/formulario-passos` (JWT)
  - Body:
```json
{
  "titulo": "Dados iniciais",
  "descricao": "Introducao",
  "ordem_index": 1
}
```

- `PUT/PATCH /api/formulario-passos/:id` (JWT)
  - Body parcial permitido (`titulo`, `descricao`, `ordem_index`).

- `DELETE /api/formulario-passos/:id` (JWT)

- `PATCH /api/formulario-passos/reorder` (JWT)
  - Body:
```json
{
  "profissao_id": 1,
  "itens": [
    { "id": 10, "ordem_index": 1 },
    { "id": 11, "ordem_index": 2 }
  ]
}
```

## Campos

- `GET /api/formulario-campos/tipos`
  - Lista os tipos de campo disponiveis para o admin com `valor`, `label`, `aceita_opcoes` e `tem_opcoes_padrao_nao_editaveis`.
  - Deve incluir `foto`.

- `GET /api/formulario-passos/:passoId/formulario-campos`
  - Lista os campos do passo ordenados por `ordem_index`.
  - Cada item retorna `tipo_campo_label`, `tipo_campo_aceita_opcoes` e `tipo_campo_tem_opcoes_padrao_nao_editaveis` para exibicao e comportamento no admin.
  - Campos `foto` retornam `max_fotos`; os demais retornam `max_fotos: null` ou omisso conforme serializacao do consumidor.

- `POST /api/formulario-passos/:passoId/formulario-campos` (JWT)
  - Body:
```json
{
  "nome": "Fotos da ocorrencia",
  "tipo_campo": "foto",
  "max_fotos": 3,
  "obrigatorio": false,
  "dica": "Envie ate 3 fotos",
  "ordem_index": 4
}
```

  - Exemplo com opcoes:
```json
{
  "nome": "Area de atuacao",
  "tipo_campo": "select",
  "opcoes": [
    { "valor": "pediatria", "label": "Pediatria" },
    { "valor": "ortodontia", "label": "Ortodontia" }
  ],
  "obrigatorio": true,
  "dica": "Escolha uma opcao",
  "ordem_index": 1
}
```

- `PUT/PATCH /api/formulario-campos/:id` (JWT)
  - Body parcial permitido (`nome`, `tipo_campo`, `opcoes`, `max_fotos`, `obrigatorio`, `dica`, `ordem_index`).

- `DELETE /api/formulario-campos/:id` (JWT)

- `PATCH /api/formulario-campos/reorder` (JWT)
  - Body:
```json
{
  "formulario_passo_id": 10,
  "itens": [
    { "id": 20, "ordem_index": 1 },
    { "id": 21, "ordem_index": 2 }
  ]
}
```

## Regras de dominio

- `tipo_campo` permitido: `texto`, `textarea`, `numero`, `data`, `switch`, `select`, `radio`, `checkbox`, `bairro`, `cep`, `foto`.
- `opcoes` obrigatoria para `select`, `radio` e `checkbox`.
- `opcoes` proibida para `foto` e para os demais tipos fora de `select`, `radio` e `checkbox`.
- `max_fotos` e obrigatorio para `foto`.
- `max_fotos` deve ser inteiro entre `1` e `5`.
- `max_fotos` e proibido para qualquer tipo diferente de `foto`.
- `bairro` possui opcoes padrao de dominio e elas nao devem ser editadas manualmente pelo usuario no admin.
- Regra de privacidade: fotos de denuncias anonimas nao podem ser persistidas em banco, disco ou filesystem. Quando o fluxo de denuncia com fotos for implementado, os arquivos so poderao existir em memoria durante a geracao do PDF enviado por email.
- Reorder exige lista completa de IDs do escopo (todos os passos da profissao ou todos os campos do passo).
