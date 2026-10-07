/* Guia de fronteiras para brasileiros de moto. Revisar a cada 15 dias.
   Sempre confirmar no consulado do país antes de viajar: regras mudam. */
const FRONTEIRAS = {
  verificado: '2026-10-07',
  geral: {
    titulo: 'Para qualquer país da América do Sul',
    itens: [
      'RG em bom estado e emitido há menos de 10 anos, ou a CIN física. Na prática, RG mais antigo tem sido recusado. Passaporte com pelo menos 6 meses de validade resolve.',
      'CNH física e válida. A CNH digital ainda não é bem aceita fora do Brasil.',
      'CRLV original da moto, no nome de quem pilota.',
      'Moto de outra pessoa: autorização do dono com firma reconhecida em cartório. Moto financiada: carta de autorização do banco.',
      'Permanência de turista: em geral até 90 dias.',
      'Leve tudo impresso, além da versão no celular.'
    ]
  },
  paises: {
    ar: { nome: 'Argentina', itens: [
      'Carta Verde obrigatória (seguro de danos a terceiros do Mercosul). Contrate antes, ainda no Brasil, em seguradora autorizada pela Susep.',
      'Seguro viagem (saúde) obrigatório para turistas desde o DNU 366/2025. Leve a apólice impressa ou no celular.',
      'CNH brasileira vale para turistas.'
    ], fontes: [['Migraciones Argentina', 'https://www.argentina.gob.ar/interior/migraciones'], ['Guia Mochileiros (set/2026)', 'https://www.mochileiros.com/blog/entrar-na-argentina']] },
    uy: { nome: 'Uruguai', itens: [
      'Carta Verde obrigatória para motos com placa brasileira. Contrate antes de cruzar.',
      'Moto brasileira pode ficar até 90 dias no país.',
      'Pedágio: o "Passe Turista" (telepeaje) é opcional e agiliza.'
    ], fontes: [['Guia Mochileiros (mai/2026)', 'https://www.mochileiros.com/blog/documentos-para-entrar-no-uruguai']] },
    py: { nome: 'Paraguai', itens: [
      'Carta Verde obrigatória.',
      'Mesmos documentos do Mercosul: RG ou passaporte, CNH e CRLV.'
    ], fontes: [['Vrum: CNH no Mercosul (jul/2026)', 'https://www.vrum.com.br/motos/2026/07/7467258-sua-cnh-vale-no-mercosul-o-guia-para-viajar-de-moto-pela-america-do-sul.html']] },
    cl: { nome: 'Chile', itens: [
      'SOAPEX obrigatório para veículos com placa estrangeira, inclusive motos (seguro de acidentes pessoais). Contrate online com antecedência: na fronteira é mais caro e demorado.',
      'Declaração Jurada do SAG para todos os maiores de 18 anos: declare qualquer alimento de origem animal ou vegetal. A fiscalização é rígida.',
      'CNH brasileira válida para turistas por até 3 meses. Leve a PID (Permissão Internacional para Dirigir) por segurança.',
      'Pode ser pedida comprovação de recursos de cerca de US$ 46 por dia.',
      'Carta Verde não vale no Chile, mas você precisa dela para atravessar a Argentina até lá.'
    ], fontes: [['SAG Chile', 'https://www.sag.gob.cl'], ['Dicas Chile: SOAPEX (set/2026)', 'https://dicaschile.com.br/chile/tudo-sobre-a-soapex-para-o-chile/'], ['Guia Mochileiros (out/2026)', 'https://www.mochileiros.com/blog/entrar-no-chile']] },
    bo: { nome: 'Bolívia', itens: [
      'Certificado Internacional de Vacinação contra febre amarela obrigatório (vacina tomada pelo menos 10 dias antes).',
      'Registro gratuito da moto no SIVETUR (sistema de veículos de turismo). Guarde o comprovante da autorização de circulação: o consulado relata veículos apreendidos por falha no registro.',
      'Seguro de danos a terceiros válido na Bolívia, com cobertura mínima igual à da Carta Verde (a adesão boliviana à Carta Verde ainda está em andamento).',
      'Leve a PID: há relatos de pedido pela polícia em Santa Cruz.',
      'Quem entra com RG recebe um comprovante de entrada: guarde, ele é exigido na saída.',
      'O consulado brasileiro em Santa Cruz recomenda cautela com viagens de veículo com placa brasileira.'
    ], fontes: [['Guia Mochileiros (jun/2026)', 'https://www.mochileiros.com/blog/entrar-na-bolivia']] },
    pe: { nome: 'Peru', itens: [
      'PID fortemente recomendada: a CNH só é aceita em algumas situações.',
      'Seguro obrigatório local (SOAT): confirme a exigência com o consulado antes de viajar.'
    ], fontes: [['Vrum: CNH no Mercosul (jul/2026)', 'https://www.vrum.com.br/motos/2026/07/7467258-sua-cnh-vale-no-mercosul-o-guia-para-viajar-de-moto-pela-america-do-sul.html']] },
    co: { nome: 'Colômbia', itens: ['PID fortemente recomendada.', 'Seguro obrigatório local (SOAT): confirme com o consulado.'], fontes: [['Vrum (jul/2026)', 'https://www.vrum.com.br/motos/2026/07/7467258-sua-cnh-vale-no-mercosul-o-guia-para-viajar-de-moto-pela-america-do-sul.html']] },
    ec: { nome: 'Equador', itens: ['PID fortemente recomendada.'], fontes: [['Vrum (jul/2026)', 'https://www.vrum.com.br/motos/2026/07/7467258-sua-cnh-vale-no-mercosul-o-guia-para-viajar-de-moto-pela-america-do-sul.html']] },
    gy: { nome: 'Guiana', itens: ['Fora dos acordos sul-americanos de trânsito: PID recomendada e pode ser obrigatória.'], fontes: [] },
    sr: { nome: 'Suriname', itens: ['Fora dos acordos sul-americanos de trânsito: PID recomendada e pode ser obrigatória.'], fontes: [] },
    gf: { nome: 'Guiana Francesa', itens: ['Território francês, fora dos acordos sul-americanos: PID recomendada e pode ser obrigatória. Verifique as regras de entrada da França.'], fontes: [] }
  }
};
