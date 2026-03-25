import { Request, Response } from 'express';
import { upload } from '../../integration/multer';
import { EnviarDenunciaRequest } from './@types';
import { DenunciaService } from './denuncia-service';

export const criarDenuncia = async (req: Request, res: Response) => {
  const service = await DenunciaService()

  const denuncia = req.body as Partial<EnviarDenunciaRequest>;
  const pdf = req.file;
  const profissaoId = Number(req.body?.profissao_id);

  if (!denuncia.regiao) {
    return res.status(400).json({ error: 'O campo "regiao" é obrigatório.' });
  }

  if (!Number.isInteger(profissaoId) || profissaoId <= 0) {
    return res.status(400).json({ error: 'O campo "profissao_id" é obrigatório e deve ser válido.' });
  }

  if (!pdf) {
    return res.status(400).json({ error: 'O arquivo PDF é obrigatório.' });
  }

  try {
    const result = await service.enviarDenuncia({ 
      protocolo: denuncia.protocolo ?? '',
      regiao: denuncia.regiao,
      profissao_id: profissaoId,
      pdf,
    });
    return res.status(201).json({ message: result.message, protocolo: result.protocolo });
  } catch (error: any) {
    const message = error?.message || 'Erro ao enviar denúncia.';
    let status = 500;
    if (message.includes('obrigatório') || message.includes('inválida') || message.includes('inativa')) {
      status = 400;
    } else if (message.includes('não encontrada')) {
      status = 404;
    }
    return res.status(status).json({ error: message });
  }
};

export const listaTodasDenuncias = async (req: Request, res: Response) => {
  const service = await DenunciaService()
  
  try {
    const denuncias = await service.listaTodasDenuncias()
    return res.status(200).json(denuncias)
  } catch (err) {
    console.error('Erro ao listar denúncias:', err);
    return res.status(500).json({ error: 'Erro ao listar denúncias.' });
  }
}

export const criarDenunciaRoute = upload.single('pdf');
