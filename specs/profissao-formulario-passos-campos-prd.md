# PRD - Formulario Dinamico por Profissao

## Problem
Hoje nao existe um modelo estruturado para montar formularios dinamicos por profissao. Isso impede que cada profissao tenha uma sequencia propria de passos e campos, com ordenacao, obrigatoriedade e configuracoes de entrada adequadas ao contexto.

O objetivo e permitir que o sistema associe uma profissao a um conjunto de passos de formulario, e que cada passo possua N campos configuraveis.

## Scope
Implementar o planejamento funcional e tecnico para suportar:
- Entidade `formulario_passo` associada a `profissao` (relacao 1:N).
- Entidade `formulario_campo` associada a `formulario_passo` (relacao 1:N).
- Ordenacao explicita de passos e campos via `ordem_index`.
- Metadados de exibicao em passo (`titulo`, `descricao`) e campo (`nome`, `dica`).
- Suporte a tipo de campo parametrizavel via `tipo_campo` (enum).
- Suporte a opcoes dinamicas em campos que exigem lista de valores via `opcoes` (jsonb).
- Suporte ao tipo `foto` com metadado dedicado `max_fotos` entre `1` e `5`.
- Marcar campos obrigatorios via `obrigatorio` (booleano).
- Rastreabilidade temporal via `data_criacao` e `data_update`.

Modelagem definida:

1. `formulario_passo`
- `id` (PK, int, auto increment)
- `profissao_id` (FK -> `profissao.id`)
- `ordem_index` (int)
- `titulo` (texto)
- `descricao` (texto)
- `data_criacao` (timestamp)
- `data_update` (timestamp)

Relacoes:
- `profissao` 1:N `formulario_passo`
- `formulario_passo` 1:N `formulario_campo`

2. `formulario_campo`
- `id` (PK, int, auto increment)
- `formulario_passo_id` (FK -> `formulario_passo.id`)
- `ordem_index` (int)
- `nome` (texto)
- `tipo_campo` (enum)
- `opcoes` (jsonb)
- `max_fotos` (int, nullable, apenas para `tipo_campo = foto`)
- `obrigatorio` (booleano)
- `dica` (texto)
- `data_criacao` (timestamp)
- `data_update` (timestamp)

Relacao:
- `formulario_passo` 1:N `formulario_campo`

## Acceptance Criteria
- [ ] E possivel cadastrar multiplos passos de formulario para uma mesma profissao, mantendo relacao por `profissao_id`.
- [ ] Cada passo aceita multiplos campos vinculados por `formulario_passo_id`.
- [ ] O sistema persiste e respeita a ordenacao de exibicao de passos e campos usando `ordem_index`.
- [ ] Campos do formulario permitem configurar `tipo_campo`, `obrigatorio`, `dica`, `opcoes` quando aplicavel e `max_fotos` quando `tipo_campo = foto`.
- [ ] O tipo `foto` nao aceita `opcoes` e exige `max_fotos` inteiro entre `1` e `5`.
- [ ] O contrato deixa explicito que fotos de denuncias anonimas nao podem ser persistidas em banco ou disco; no fluxo futuro elas so poderao existir em memoria durante a geracao do PDF enviado por email.
- [ ] A remocao de uma profissao ou passo nao deixa registros orfaos (regra de integridade referencial definida e aplicada).
- [ ] Todas as operacoes de criacao/atualizacao atualizam corretamente `data_criacao` e `data_update`.
- [ ] A modelagem permite que diferentes profissoes tenham estruturas de formulario independentes.

## Out of Scope
- Implementacao de UI/UX do construtor de formulario.
- Definicao final de layout de wizard/stepper no frontend.
- Motor de validacao avancada por regras condicionais entre campos.
- Versionamento historico de formularios (draft/publicado, revisoes).
- Internacionalizacao de labels e dicas.

## Notes
- Recomendado criar indice composto para ordenacao e consulta:
  - `formulario_passo (profissao_id, ordem_index)`
  - `formulario_campo (formulario_passo_id, ordem_index)`
- Recomendado definir politica de integridade para FKs (ex.: `ON DELETE CASCADE` ou `RESTRICT`) de forma explicita.
- Se `tipo_campo` exigir valores (ex.: select, radio, checkbox), `opcoes` deve conter estrutura JSON padronizada.
- Se `tipo_campo = foto`, `max_fotos` deve ser persistido em coluna dedicada e nao em `opcoes`.

## Open Questions
- Quais valores oficiais do enum `tipo_campo` devem ser suportados na primeira versao?
- Qual politica de delecao sera adotada nas FKs (`CASCADE`, `RESTRICT` ou `SET NULL`)?
- `titulo`, `descricao`, `nome` e `dica` terao limites maximos de tamanho definidos?
