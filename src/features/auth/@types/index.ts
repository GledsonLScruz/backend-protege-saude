export type UsuarioAdmin = {
  id?: number;
  usuario: string;
  senha_hash: string;
  refresh_token_hash?: string | null;
  data_criacao?: string;
  data_update?: string;
};

export type LoginRequestDTO = {
  usuario: string;
  senha: string;
};
