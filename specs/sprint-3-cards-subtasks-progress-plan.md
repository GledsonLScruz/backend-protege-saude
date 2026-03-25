# Sprint 3 - Subtasks e Plano de Progresso

## Objetivo da Sprint
Entregar a base completa para formularios configuraveis por profissao: modelagem, APIs administrativas e interface de configuracao.

## US031 - Criar tabelas de passos do formulario
**Descricao:** Como sistema, preciso armazenar os passos de um formulario de denuncia configuravel.

### Subtasks
- [ ] Definir migration da tabela `formulario_passo` com colunas obrigatorias (`id`, `profissao_id`, `ordem_index`, `titulo`, `descricao`, `data_criacao`, `data_update`).
- [ ] Configurar FK `profissao_id -> profissao.id` com politica de delete definida.
- [ ] Criar indice composto `idx_formulario_passo_profissao_ordem` (`profissao_id`, `ordem_index`).
- [ ] Definir default/trigger para `data_criacao` e `data_update`.
- [ ] Criar model/repository da entidade.
- [ ] Escrever teste de migration (estrutura e constraints).
- [ ] Escrever teste de persistencia basica (create/list por profissao).

### Definition of Done
- Migration aplicada com sucesso em ambiente local.
- Constraint e indice validados por teste.
- Entidade disponivel para consumo da API.

## US032 - Criar tabelas de campos do formulario
**Descricao:** Como sistema, preciso armazenar os campos que compoem cada passo do formulario.

### Subtasks
- [ ] Definir migration da tabela `formulario_campo` com colunas obrigatorias (`id`, `formulario_passo_id`, `ordem_index`, `nome`, `tipo_campo`, `opcoes`, `obrigatorio`, `dica`, `data_criacao`, `data_update`).
- [ ] Configurar FK `formulario_passo_id -> formulario_passo.id` com politica de delete definida.
- [ ] Criar indice composto `idx_formulario_campo_passo_ordem` (`formulario_passo_id`, `ordem_index`).
- [ ] Definir enum `tipo_campo` (v1) e regras de validacao de `opcoes` por tipo.
- [ ] Definir default para `obrigatorio` (false, se aplicavel).
- [ ] Criar model/repository da entidade.
- [ ] Escrever testes de migration, enum e integridade referencial.

### Definition of Done
- Tabela e enum criados e validados.
- Regras minimas de consistencia de `tipo_campo` e `opcoes` ativas.
- Entidade pronta para uso pela API de campos.

## US033 - Implementar API de criacao, edicao e ordenacao de passos
**Descricao:** Como administrador, quero gerenciar os passos do formulario dinamicamente.

### Subtasks
- [ ] Definir contrato de endpoints (CRUD + reorder) com payloads e codigos HTTP.
- [ ] Implementar `POST /profissoes/:profissaoId/formulario-passos`.
- [ ] Implementar `PUT/PATCH /formulario-passos/:id`.
- [ ] Implementar `GET /profissoes/:profissaoId/formulario-passos` ordenado por `ordem_index`.
- [ ] Implementar endpoint de ordenacao em lote (ex.: `PATCH /formulario-passos/reorder`).
- [ ] Validar unicidade logica de `ordem_index` por profissao.
- [ ] Tratar erros de negocio (profissao inexistente, passo inexistente, ordem invalida).
- [ ] Cobrir com testes unitarios e de integracao dos endpoints.
- [ ] Atualizar documentacao de API (OpenAPI/colecao interna).

### Definition of Done
- Endpoints de passos operacionais com testes verdes.
- Ordenacao persistida e refletida no GET.
- Documentacao atualizada.

## US034 - Implementar API de criacao, edicao e ordenacao de campos
**Descricao:** Como administrador, quero gerenciar os campos do formulario dentro de cada passo.

### Subtasks
- [ ] Definir contrato de endpoints (CRUD + reorder) para campos.
- [ ] Implementar `POST /formulario-passos/:passoId/formulario-campos`.
- [ ] Implementar `PUT/PATCH /formulario-campos/:id`.
- [ ] Implementar `GET /formulario-passos/:passoId/formulario-campos` ordenado por `ordem_index`.
- [ ] Implementar endpoint de ordenacao em lote de campos.
- [ ] Validar regras por `tipo_campo` (`opcoes` obrigatoria quando aplicavel).
- [ ] Validar `obrigatorio`, `nome`, `dica` e limites de payload.
- [ ] Cobrir com testes unitarios e de integracao de regras + endpoints.
- [ ] Atualizar documentacao de API.

### Definition of Done
- Endpoints de campos funcionais com validacoes de dominio.
- Ordenacao por passo consistente apos reorder.
- Testes e documentacao concluidos.

## US035 - Criar interface administrativa para configuracao do formulario
**Descricao:** Como administrador, quero uma interface para montar formularios personalizados por profissao.

### Subtasks
- [ ] Definir fluxo UX: selecionar profissao -> listar passos -> editar passo -> gerenciar campos.
- [ ] Implementar tela/listagem de passos por profissao com acoes de criar/editar/excluir.
- [ ] Implementar ordenacao de passos (drag-and-drop ou controles de mover).
- [ ] Implementar tela de campos por passo com criar/editar/excluir.
- [ ] Implementar ordenacao de campos.
- [ ] Implementar formulario de campo com `tipo_campo`, `obrigatorio`, `dica`, `opcoes` dinamicas.
- [ ] Integrar com APIs US033/US034 com estados de loading, erro e sucesso.
- [ ] Implementar feedbacks UX (toasts, confirmacao de exclusao, empty states).
- [ ] Cobrir com testes de interface/comportamento critico.

### Definition of Done
- Admin consegue montar formulario completo por profissao sem acoes manuais no banco.
- Ordenacao de passos e campos refletida no backend.
- Validacoes de formulario impedem configuracoes invalidas.

## Plano de Progresso (Sequencia Recomendada)

### Fase 1 - Fundacao de Dados (Dias 1-2)
- US031 (100%)
- US032 (100%)

**Marco:** banco pronto, migrations estaveis e entidades disponiveis.

### Fase 2 - APIs de Passos (Dias 3-4)
- US033 (100%)

**Marco:** passos gerenciados via API com reorder e testes.

### Fase 3 - APIs de Campos (Dias 5-6)
- US034 (100%)

**Marco:** campos gerenciados via API com validacoes por tipo.

### Fase 4 - Interface Admin (Dias 7-9)
- US035 (100%)

**Marco:** fluxo ponta a ponta funcional no painel admin.

### Fase 5 - Hardening e Fechamento (Dia 10)
- [ ] Regressao ponta a ponta (profissao -> passos -> campos -> reorder).
- [ ] Ajustes de bugs e refinamentos de UX.
- [ ] Revisao final de documentacao e criterios de aceite.

**Marco final da Sprint:** feature pronta para homologacao.

## Dependencias
- US033 depende de US031.
- US034 depende de US032 e da disponibilidade do fluxo de passo.
- US035 depende de US033 + US034.

## Riscos e Mitigacoes
- Risco: indefinicao do enum `tipo_campo` atrasar validacoes.
  Mitigacao: fechar lista v1 no inicio da Fase 2.
- Risco: reorder gerar conflito de `ordem_index` em concorrencia.
  Mitigacao: reorder em transacao + estrategia de reindexacao.
- Risco: retrabalho de frontend por contrato instavel de API.
  Mitigacao: congelar contrato de US033/US034 antes de iniciar US035.
