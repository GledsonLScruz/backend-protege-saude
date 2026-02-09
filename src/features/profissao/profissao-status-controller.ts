import { Request, Response } from 'express';
import { ProfissaoService } from './profissao-service';

export const alterarStatusProfissao = async (req: Request, res: Response) => {
  const service = await ProfissaoService();
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const { status } = req.body;
  try {
    const atualizada = await service.alterarStatus(id, status);
    return res.json(atualizada);
  } catch (error: any) {
    const message = error?.message || 'Erro ao alterar status';
    let statusCode = 400;
    if (message.includes('não encontrada')) statusCode = 404;
    return res.status(statusCode).json({ error: message });
  }
};
