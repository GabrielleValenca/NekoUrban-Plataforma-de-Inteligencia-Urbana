import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Comentario { id: number; texto: string; autor: string; criadoEm: string; }
export interface Notificacao { id: number; ocorrenciaId: number; mensagem: string; lida: boolean; criadaEm: string; }

@Injectable({ providedIn: 'root' })
export class InteracoesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = 'http://localhost:3000/api';
  private opcoes() { return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.tokenAtual()}` }) }; }
  comentarios(id: number) { return this.http.get<Comentario[]>(`${this.base}/ocorrencias/${id}/comentarios`, this.opcoes()); }
  comentar(id: number, texto: string) { return this.http.post(`${this.base}/ocorrencias/${id}/comentarios`, { texto }, this.opcoes()); }
  apoiar(id: number) { return this.http.post(`${this.base}/ocorrencias/${id}/apoio`, {}, this.opcoes()); }
  removerApoio(id: number) { return this.http.delete(`${this.base}/ocorrencias/${id}/apoio`, this.opcoes()); }
  notificacoes() { return this.http.get<Notificacao[]>(`${this.base}/notificacoes`, this.opcoes()); }
  marcarLida(id: number) { return this.http.patch(`${this.base}/notificacoes/${id}/ler`, {}, this.opcoes()); }
  mudarStatus(id: number, status: string) { return this.http.patch(`${this.base}/ocorrencias/${id}/status`, { status }, this.opcoes()); }
}
