import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
type Perfil = 'cidadao' | 'gestor';
type UsuarioToken = { id: number; municipioId: number; perfil: Perfil };
declare global { namespace Express { interface Request { usuario?: UsuarioToken } } }
function segredo() {
  const valor = process.env.JWT_SECRET;
  if (!valor || valor.length < 32 || valor === 'SUBSTITUA_POR_UMA_CHAVE_ALEATORIA_LONGA') throw new Error('Configure JWT_SECRET seguro.');
  return valor;
}
export function criarToken(usuario: UsuarioToken) { return jwt.sign(usuario, segredo(), { expiresIn: '2h' }); }
export function autenticar(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) { res.status(401).json({ erro: 'Faça login para continuar.' }); return; }
  try {
    const dados = jwt.verify(token, segredo()) as JwtPayload;
    if (typeof dados['id'] !== 'number' || typeof dados['municipioId'] !== 'number' || !['cidadao','gestor'].includes(dados['perfil'])) {
      res.status(401).json({ erro: 'Token inválido.' }); return;
    }
    req.usuario = { id: dados['id'], municipioId: dados['municipioId'], perfil: dados['perfil'] as Perfil };
    next();
  } catch { res.status(401).json({ erro: 'Sessão inválida ou expirada.' }); }
}
export function exigirGestor(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.perfil !== 'gestor') { res.status(403).json({ erro: 'Acesso permitido apenas a gestores.' }); return; }
  next();
}
