# ProtegeSaude V2

## Documentação de Regras de Negócio, Validações e Fluxos do Sistema de Denúncias

## 1. Princípios do Sistema

O sistema de denúncias do ProtegeSaude é guiado pelos seguintes princípios:

* Simplicidade de uso para o denunciante
* Anonimato e privacidade por padrão
* Armazenamento mínimo de dados
* Separação clara entre dados sensíveis e metadados
* Encaminhamento correto e automático das denúncias
* Configuração dinâmica sem alteração de código

Nenhuma regra de negócio deve violar esses princípios.

---

## 2. Atores do Sistema

### 2.1 Denunciante

* Profissional de saúde ou cidadão
* Não cria conta
* Não fornece dados pessoais identificáveis
* Interage apenas com:

  * Seleção de profissão
  * Consulta de documentos
  * Preenchimento do formulário de denúncia

### 2.2 Administrador

* Usuário autenticado
* Responsável por configurar:

  * Profissões
  * Documentos
  * Formulários
  * Conselhos Tutelares e bairros

---

## 3. Regras de Negócio – Profissões

### 3.1 Cadastro de Profissão

* Nome é obrigatório e único
* Descrição é obrigatória
* Cor é obrigatória (usada apenas para identificação visual)
* Status define se a profissão está ativa

### 3.2 Ativação e Desativação

* Profissões desativadas:

  * Não aparecem para seleção no site/app
  * Não podem receber novas denúncias
* Profissões desativadas não são excluídas fisicamente
* O sistema utiliza soft delete (`data_delete`)

### 3.3 Impactos

* Toda denúncia sempre referencia uma profissão válida
* Profissões com denúncias associadas nunca podem ser removidas definitivamente

---

## 4. Regras de Negócio – Documentos Norteadores

### 4.1 Associação

* Todo documento pertence a exatamente uma profissão
* Documentos não existem sem profissão

### 4.2 Validações

* Título é obrigatório
* Pelo menos um meio de acesso deve existir:

  * URL online ou arquivo para download
* Arquivos aceitos:

  * PDF
* Imagem de capa é opcional

### 4.3 Exibição

* Apenas documentos da profissão selecionada são exibidos
* Documentos não influenciam o fluxo de denúncia

---

## 5. Regras de Negócio – Formulário Dinâmico

### 5.1 Estrutura Geral

* Cada profissão possui seu próprio formulário
* O formulário é composto por:

  * Passos (`FormularioPasso`)
  * Campos (`FormularioCampo`)

### 5.2 Passos do Formulário

* Cada passo pertence a uma profissão
* Ordem é definida por `ordem_index`
* A ordem deve ser contínua e única por profissão
* Um passo não pode existir sem profissão

### 5.3 Campos do Formulário

* Cada campo pertence a um único passo
* Campos herdam implicitamente a profissão via o passo
* Tipos de campo suportados:

  * Texto
  * Número
  * Seleção única
  * Seleção múltipla
  * Data
  * Booleano

### 5.4 Validações de Campos

* Nome do campo é obrigatório
* Tipo do campo é obrigatório
* Se `obrigatorio = true`, o campo deve ser preenchido
* Se o tipo exigir opções:

  * `opcoes` deve existir e ser válida
* Ordem (`ordem_index`) deve ser única dentro do passo

### 5.5 Imutabilidade em Produção

* Alterações no formulário:

  * Não afetam denúncias já enviadas
  * Valem apenas para novas denúncias

---

## 6. Regras de Negócio – Clonagem de Profissões

### 6.1 Escopo da Clonagem

Ao clonar uma profissão, o sistema deve duplicar:

* Registro da profissão (com novo ID)
* Documentos associados
* Passos do formulário
* Campos de cada passo

### 6.2 Regras

* A profissão clonada inicia como desativada
* Nenhuma denúncia é clonada
* Todos os IDs são regenerados

---

## 7. Fluxo de Denúncia

### 7.1 Fluxo Principal

1. Usuário acessa a plataforma
2. Seleciona uma profissão ativa
3. Visualiza documentos norteadores (opcional)
4. Inicia o formulário de denúncia
5. Preenche os passos sequencialmente
6. Submete o formulário
7. Sistema valida os dados
8. Sistema gera:

   * Protocolo único
   * PDF da denúncia
9. Sistema identifica a região
10. PDF é enviado ao Conselho Tutelar responsável
11. Denúncia é finalizada

---

## 8. Regras de Negócio – Denúncia

### 8.1 Armazenamento

A entidade Denúncia armazena apenas:

* Protocolo (único)
* Data de criação
* Região
* Profissão

Nenhum dado sensível do formulário é persistido no banco.

### 8.2 Protocolo

* Gerado automaticamente
* Único
* Não sequencial
* Não dedutível

### 8.3 Imutabilidade

* Denúncias não podem ser editadas
* Denúncias não podem ser excluídas
* Denúncias não possuem `data_update`

---

## 9. Geração e Envio do PDF

### 9.1 Geração

* O PDF é gerado apenas após validação completa
* O conteúdo reflete exatamente os dados preenchidos
* Campos não preenchidos não devem assumir valores falsos

### 9.2 Envio

* O PDF é enviado apenas ao Conselho Tutelar responsável
* Nenhuma cópia é enviada ao denunciante
* O PDF não é armazenado permanentemente no servidor

---

## 10. Regras de Negócio – Conselhos Tutelares

### 10.1 Conselho

* Representa uma unidade administrativa
* Possui:

  * Nome
  * Cidade
  * Email principal
* Pode existir sem bairros associados

### 10.2 Bairros

* Associação opcional
* Cada bairro pertence a um único conselho
* O nome do bairro deve ser único dentro do conselho

---

## 11. Identificação de Região

* A região é determinada no backend
* Baseada nos dados informados no formulário
* O usuário não escolhe a região manualmente
* A região é armazenada como texto na denúncia

---

## 12. Validações Globais

* Nenhuma denúncia pode ser criada sem profissão
* Nenhuma denúncia pode ser criada com profissão desativada
* Campos obrigatórios sempre devem ser validados no backend
* O frontend nunca é fonte de verdade

---

## 13. Segurança e Privacidade

### 13.1 Anonimato

* Nenhum dado pessoal do denunciante é coletado
* Nenhum IP é armazenado
* Nenhum identificador de sessão é persistido

### 13.2 Minimização de Dados

* Apenas metadados essenciais são persistidos
* Dados sensíveis existem apenas:

  * Em memória
  * No PDF gerado
  * No envio ao conselho

### 13.3 Logs

* Logs não devem conter dados do formulário
* Logs podem conter apenas:

  * Erros técnicos
  * IDs internos
  * Protocolos

---

## 14. Edge Cases

### 14.1 Profissão desativada durante preenchimento

* Denúncia deve ser bloqueada no envio
* Usuário deve ser informado

### 14.2 Falha no envio de e-mail

* Denúncia não é considerada concluída
* PDF não deve ser descartado até retry
* Erro deve ser logado sem dados sensíveis

### 14.3 Conselho sem bairro configurado

* O sistema deve usar o e-mail principal do conselho
* A denúncia não pode ser bloqueada

### 14.4 Alteração de formulário em uso

* Denúncia em andamento continua com o snapshot atual
* Novas denúncias usam a nova versão

---

## 15. Restrições Técnicas

* Banco de dados não armazena conteúdo da denúncia
* O sistema depende de conectividade para envio
* O sistema deve funcionar com múltiplas profissões sem reconfiguração de código

---

## 16. Considerações Finais

O sistema de denúncias do ProtegeSaude V2 foi projetado para equilibrar responsabilidade legal, usabilidade e proteção do denunciante. Todas as regras aqui descritas devem ser respeitadas em qualquer evolução futura da plataforma, garantindo que simplicidade, segurança e privacidade permaneçam como pilares centrais da solução.

---

Se quiser, posso:

* adaptar isso para **capítulo formal de TCC**
* gerar **checklists de implementação backend**
* criar **casos de teste baseados nessas regras**
* ou produzir uma **versão resumida para stakeholders**
