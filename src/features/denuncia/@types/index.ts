export interface Denuncia {
  id?: number;
  protocolo: string;
  data_criacao?: string; // ISO date string
  regiao: string;
  profissao_id?: number | null;
  conselho_tutelar_id?: number | null;
  cidade?: string | null;
  estado?: string | null;
  bairro?: string | null;
}

export enum Regiao {
  NORTE = 'norte',
  SUL = 'sul',
  LESTE = 'leste',
  OESTE = 'oeste'
}

export interface EnviarDenunciaRequest {
  protocolo: string;
  pdf: Express.Multer.File;
  regiao?: Regiao;
  profissao_id: number;
  cidade: string;
  estado: string;
  bairro: string;
}
