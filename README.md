# Rota Inteligente (21)

Prompt Mestre — Simulador Operacional de Rota (CCPR)

Objetivo: construir um sistema web chamado Simulador Operacional de Rota, parte do Sistema de Inteligência Logística da CCPR.

IMPORTANTE: este prompt define o contexto, as regras de negócio, os cálculos, as validações, a sequência de construção e os limites de escopo do projeto. As regras aqui descritas devem ser tratadas como requisitos funcionais do sistema e não devem ser alteradas sem solicitação explícita.

0. PROTEÇÃO E VERSIONAMENTO DO PROJETO — ETAPA OBRIGATÓRIA

O código do projeto não deve ficar dependente exclusivamente da plataforma Lovable.

Para este projeto, já existe um repositório GitHub próprio e privado, que deverá ser utilizado para versionamento e armazenamento do código:

Repositório: simulador-operacional-ccpr

Antes de iniciar a construção das funcionalidades, o projeto Lovable deverá ser conectado a esse repositório GitHub existente.

Regras obrigatórias

Utilizar o repositório simulador-operacional-ccpr.

O repositório deve permanecer privado.

Não criar um segundo repositório para este projeto.

Não iniciar a construção estrutural do aplicativo antes de confirmar a conexão com o GitHub.

O código desenvolvido no Lovable deverá ser sincronizado com o GitHub.

O GitHub deverá manter o histórico de versões do projeto.

Alterações importantes deverão ser preservadas no histórico do repositório.

O objetivo é reduzir a dependência da plataforma e permitir recuperação, versionamento e continuidade do desenvolvimento do código.

Sequência obrigatória

GitHub privado existente → conectar ao projeto Lovable → confirmar sincronização → iniciar construção do aplicativo.

Se a integração com o GitHub ainda não estiver configurada, não iniciar a construção das funcionalidades. Primeiro orientar a configuração da integração.

1. CONTEXTO DO SISTEMA

Construa um sistema web chamado Simulador Operacional de Rota, parte do Sistema de Inteligência Logística da CCPR — Cooperativa de Captação de Leite.

O sistema será uma ferramenta de uso diário/semanal para gestores de unidade identificarem rotas de coleta de leite com custo elevado e simularem duas ações principais:

Crescer o volume captado dos produtores já existentes em uma rota.

Trocar o perfil de equipamento utilizado na rota.

O objetivo é permitir que o gestor veja o impacto operacional e econômico antes de tomar uma decisão na operação real.

O sistema deve ser simples, rápido, operacional e orientado à tomada de decisão.

Não construir uma ferramenta excessivamente complexa ou voltada para apresentações estratégicas.

2. STACK E PADRÕES TÉCNICOS

Utilizar preferencialmente:

React

TypeScript

Tailwind CSS

Backend simples

Banco de dados relacional

Postgres via Supabase é aceitável

Todo o sistema deve estar em português do Brasil (pt-BR).

Utilizar padrão brasileiro para números:

Milhar: .

Decimal: ,

Exemplo: 1.234,56

Moeda: R$ 1.234,56

3. TELA 1 — IMPORTAÇÃO DE DADOS

Criar uma tela de importação capaz de receber 3 tipos de arquivos CSV.

Configuração dos arquivos

Separador: ;

Encoding: Latin-1 / ISO-8859-1

3.1 Arquivo A — Tabela de Tarifas de Equipamento

Colunas esperadas:

Tipo de equipamento

Capacidade máxima (litros)

Diária (R$)

Custo por km (R$/km)

3.2 Arquivo B — Produtores_Rotas

Exportação do Axiodis.

Colunas esperadas:

Código

Nome

Rota

Volume/coleta

Posição

Veículo

Dt/Hr Coleta

Tempo Coleta

Distância Total

Volume Total

Hr Início Rota

Hr Termino Descarga

Tempo de Descarga

Custo Total Rota

Custo (R$/L)

Local Descarga

3.3 Arquivo C — Route_now

Exportação do Axiodis.

Colunas esperadas:

Veículo

Ordem

Rota

Atividade

Matrícula

Descrição

Volume

Km etapa

Dt/Hr coleta

Latitude

Longitude

Atividades possíveis:

Coleta

Descarrega

Saída

Regresso

Balanza

Pausa

Transvaso

Desengate

Engate

Troca de M

Espera

Descanso

4. VALIDAÇÕES NA IMPORTAÇÃO

Antes de importar os dados definitivamente, o sistema deverá validar:

4.1 Estrutura

Verificar:

separador;

encoding;

existência das colunas esperadas;

nomes das colunas;

quantidade de colunas;

possíveis divergências de estrutura.

Caso exista divergência, não importar silenciosamente.

Mostrar ao usuário uma mensagem clara indicando:

coluna esperada;

coluna encontrada;

problema identificado;

ação recomendada.

4.2 Validação de volume

Para os arquivos B e C:

Validar se a soma de Volume/coleta por rota é compatível com o Volume Total registrado para aquela rota.

Caso exista divergência relevante:

sinalizar a rota;

informar o valor esperado;

informar o valor encontrado;

não ocultar o problema.

4.3 Validação de tarifas

Alertar quando existir uma rota utilizando um equipamento que não possua tarifa cadastrada na tabela A.

O sistema não deve inventar tarifa.

5. EXTRAÇÕES E REGRAS DERIVADAS DOS DADOS

O sistema deverá extrair automaticamente as seguintes informações.

5.1 Sufixo da rota

O tipo/sufixo da rota corresponde à última letra do código da rota.

Exemplo:

2741D → sufixo D

5.2 Região / Linha do produtor

A região de cada produtor deve ser extraída do segmento Linha do código do produtor.

O código possui a estrutura:

Cooperativa + Linha + Matrícula

Exemplo:

205 + 501 + 587

Resultado:

205501587

Estrutura:

Cooperativa = 3 dígitos

Linha = 3 dígitos

Matrícula = 3 dígitos

Portanto, o código possui 9 dígitos.

A região utilizada nos filtros e análises será o segmento Linha.

5.3 Decodificação do veículo

O veículo possui estrutura:

[unidade 4 dígitos][transportadora 3 letras][capacidade nominal em milhares][sigla do tipo + nº sequencial]

Exemplo:

0081VIA18BT10

Interpretar como:

Unidade: 0081

Transportadora: VIA

Capacidade nominal: 18.000 L

Tipo: BT

Equipamento: Bitrem

Essa informação deverá ser utilizada para identificar o equipamento atual da rota.

6. CÁLCULO DA JORNADA DA ROTA

A jornada da rota deve ser calculada utilizando:

Horário do evento "Balanza" − Hr Início Rota

O evento Balanza representa a chegada/pesagem na base.

Não incluir no cálculo da jornada:

tempo de descarga;

tempo de regresso.

Portanto:

Jornada = Horário Balanza − Hr Início Rota

6.1 Troca de motorista

Se existir evento "Troca de M" na rota:

calcular a jornada por trecho/motorista;

o motorista antes da troca possui sua própria jornada;

o motorista após a troca inicia uma nova jornada;

não aplicar automaticamente o mesmo limite de jornada aos dois trechos como se fossem uma única jornada.

7. CICLO PAR / ÍMPAR

O ciclo da rota deve ser inferido a partir da data de execução da rota.

Dia par do mês → ciclo Par

Dia ímpar do mês → ciclo Ímpar

8. REGRA DE NEGÓCIO CRÍTICA — COMPATIBILIDADE ROTA × EQUIPAMENTO

Esta é uma regra obrigatória e deve ser respeitada em toda sugestão ou simulação de troca de equipamento.

O equipamento permitido é definido pelo sufixo da rota.

Tabela de compatibilidade

SufixoEquipamento permitidoDEquipamento solteiro — Toco, Truck ou Bitruck, sem reboqueREquipamento + reboque acoplado — Toco+Reboque, Truck+Reboque ou Bitruck+ReboqueARota de apoio — sempre equipamento solteiroBRota de apoio — sempre equipamento solteiroCRota de apoio — sempre equipamento solteiroERota externa — leite de cooperativa parceira — sempre equipamento solteiroSSegundo percurso — produtor/tanque de grande volume — somente Carreta, Bitrem ou Vanderleia

Regra absoluta

Nunca oferecer equipamento incompatível com o sufixo da rota.

A interface deve:

ocultar equipamentos incompatíveis; ou

desabilitá-los.

Não basta mostrar um alerta depois que o usuário selecionou uma opção inválida.

9. MOTOR DE CÁLCULO

Criar um motor de cálculo separado da interface.

As funções de cálculo devem ser puras, reutilizáveis e testáveis.

9.1 Custo de uma rota

custoRota(km, equipamento) =
    equipamento.diaria + (km * equipamento.custoPorKm)


9.2 Custo por litro

custoPorLitro(custoRota, volume) =
    custoRota / volume


10. SIMULAÇÃO — CRESCIMENTO DE VOLUME

Para simular aumento de volume em uma rota existente:

novoVolume =
    volumeAtual + aumentoVolumeInformado

novoKm =
    kmAtual + aumentoKmInformado

novoCusto =
    custoRota(novoKm, equipamentoAtual)

novoCustoPorLitro =
    custoPorLitro(novoCusto, novoVolume)


O sistema deve alertar quando:

novoVolume > capacidadeMaximaDoEquipamentoAtual


A simulação deve mostrar claramente:

ANTES → DEPOIS

11. SIMULAÇÃO — TROCA DE EQUIPAMENTO

Para cada equipamento compatível com o sufixo da rota:

Utilizar os valores reais da rota atual:

km atual;

volume atual.

Calcular:

custoComparado =
    custoRota(kmAtual, equipamentoCandidato)

custoPorLitroComparado =
    custoPorLitro(custoComparado, volumeAtual)


Ordenar os equipamentos do:

menor custo por litro → maior custo por litro

Destacar o equipamento com melhor resultado.

Nunca comparar equipamentos incompatíveis com a rota.

12. TELA 2 — RANKING DE ROTAS

Criar uma tela de ranking das rotas.

Filtros

Unidade

Região / Linha

Ciclo Par/Ímpar

Sufixo da rota

Tabela

Ordenar inicialmente por:

Custo (R$/L) decrescente

Mostrar:

Código da rota

Região

Equipamento atual

Volume

Km

Densidade (Volume/Km)

Custo total

R$/L

Jornada calculada

Destaque

As rotas com maior custo por litro dentro do filtro atual devem receber destaque visual.

O usuário deve conseguir identificar rapidamente as rotas prioritárias.

Navegação

Ao clicar em uma rota:

→ abrir a Tela 3 — Simulação Rápida de Rota

13. TELA 3 — SIMULAÇÃO RÁPIDA DE ROTA

Ao abrir uma rota, mostrar os dados atuais:

Volume

Km

Equipamento

Custo total

R$/L

Densidade

Jornada

13.1 Ação 1 — Crescer volume

Disponibilizar campos para:

aumento de volume;

aumento de km.

Mostrar em tempo real:

Antes → Depois

Apresentar:

volume;

km;

custo;

R$/L;

densidade.

Alertar quando ultrapassar a capacidade do equipamento.

13.2 Ação 2 — Trocar equipamento

Mostrar uma tabela comparativa contendo todos os equipamentos compatíveis com o sufixo da rota.

Para cada equipamento mostrar:

equipamento;

capacidade;

diária;

custo/km;

custo total simulado;

R$/L simulado;

diferença de R$/L versus equipamento atual.

Ordenar pelo menor R$/L resultante.

Destacar a melhor alternativa.

13.3 Aplicação da simulação

Criar botão:

"Marcar simulação como aplicada"

Ao utilizar essa função, registrar que a mudança simulada foi marcada pelo usuário como adotada na operação real.

Não alterar silenciosamente os dados históricos originais.

A simulação aplicada deve ser registrada separadamente do dado original.

14. TELA 4 — ANÁLISE REGIONAL

Permitir selecionar uma região/linha dentro de uma unidade.

Mostrar todas as rotas daquela região.

Permitir aplicar simulações da Tela 3 em uma ou mais rotas.

14.1 Indicadores regionais

Mostrar o agregado da região:

Antes

Volume total

Km total

Custo total

Densidade

R$/L médio

Depois

Volume total

Km total

Custo total

Densidade

R$/L médio

O usuário deve visualizar claramente o impacto das simulações aplicadas naquela sessão.

15. REGRAS GERAIS DE UX/UI

A interface deve ser:

em português do Brasil;

direta;

rápida;

operacional;

de baixa complexidade;

orientada à decisão.

Este é um simulador de uso frequente/dia a dia, e não uma ferramenta de reunião estratégica anual.

Priorizar:

poucos cliques;

feedback instantâneo;

leitura rápida;

informações essenciais;

comparação antes/depois.

Regra fundamental de apresentação

Sempre mostrar:

ANTES → DEPOIS

Nunca apresentar somente o resultado final de uma simulação.

Regra fundamental de compatibilidade

Nunca permitir simulação de troca para equipamento incompatível com o tipo da rota.

A interface deve:

ocultar; ou

desabilitar

as opções incompatíveis.

Formatação numérica

Utilizar sempre padrão brasileiro:

1.234,56

Exemplos:

1.250 L

27,13 L/km

R$ 0,3845/L

R$ 1.234,56

16. INTEGRIDADE DOS DADOS

O sistema deve preservar separadamente:

Dados originais

Dados importados dos arquivos oficiais.

Dados derivados

Indicadores calculados pelo sistema.

Simulações

Cenários criados pelo usuário.

Simulações aplicadas

Cenários que o usuário marcou como adotados na operação real.

Nunca sobrescrever silenciosamente o dado original importado para representar uma simulação.

17. FORA DE ESCOPO — NÃO CONSTRUIR AGORA

Não construir neste projeto, neste momento:

17.1 Simulador de Metas Anuais

É outro módulo.

Deverá trabalhar com cenários versionados por competência/ano.

Não misturar com este simulador.

17.2 Radar de Captação completo

Inclui:

dispensa de produtor;

cruzamento ocupação × jornada;

análises avançadas de captação.

Será desenvolvido em fase futura.

17.3 Outros itens fora de escopo

Não construir agora:

autenticação multiusuário robusta;

relatórios PDF;

relatórios Excel;

nova roteirização do zero;

otimização automática completa de rotas.

18. SEQUÊNCIA OBRIGATÓRIA DE CONSTRUÇÃO

Não tentar construir todo o sistema de uma única vez.

Executar na seguinte ordem:

ETAPA 0 — Proteção

Confirmar conexão com o GitHub privado simulador-operacional-ccpr.

Confirmar sincronização.

Garantir que o projeto esteja versionado.

ETAPA 1 — Dados e cálculo

Construir:

Tela 1 — Importação;

validações;

tratamento dos CSVs;

modelo de dados;

extrações automáticas;

regras de compatibilidade;

motor de cálculo.

ETAPA 2 — Ranking

Construir:

Tela 2;

filtros;

ranking;

indicadores;

navegação para a rota.

ETAPA 3 — Simulação

Construir:

Tela 3;

crescimento de volume;

troca de equipamento;

comparação antes/depois;

registro de simulação aplicada.

ETAPA 4 — Regional

Construir:

Tela 4;

consolidação regional;

aplicação de múltiplas simulações;

comparação antes/depois.

19. REGRA DE EXECUÇÃO DO PROJETO

Não avançar para a próxima etapa enquanto a etapa atual não estiver funcional.

Após cada etapa:

testar;

validar os cálculos;

verificar as regras de negócio;

corrigir inconsistências;

sincronizar o código com o GitHub;

somente então avançar.

Não simplificar, remover ou alterar regras de negócio deste prompt para facilitar a implementação sem solicitar autorização.

Quando houver uma decisão técnica que não esteja definida neste documento, escolher a solução mais simples, robusta e compatível com a arquitetura existente, preservando sempre as regras de negócio acima.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/acf9ba1b-a0a2-4896-8552-f733d34a094d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
