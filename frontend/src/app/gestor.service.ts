import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Grupo { nome: string; total: number }
export interface Ponto { id: number; latitude: number; longitude: number; status: string }
export interface Indicadores {
  resumo: { total: number; pendentes: number; emAndamento: number; resolvidas: number };
  categorias: Grupo[]; bairros: Grupo[]; evolucao: { mes: string; total: number }[]; pontos: Ponto[];
}
export interface Historico {
  id: number; ocorrenciaId: number; anterior: string; novo: string; gestor: string; alteradoEm: string;
}
export interface FiltrosGestor { categoriaId: string; status: string; bairro: string; inicio: string; fim: string }

@Injectable({ providedIn: 'root' })
export class GestorService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = 'http://localhost:3000/api/gestor';
  private opcoes(f: FiltrosGestor) {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(f)) if (valor) params = params.set(chave, valor);
    return { params, headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.tokenAtual()}` }) };
  }
  indicadores(f: FiltrosGestor) { return this.http.get<Indicadores>(`${this.base}/indicadores`, this.opcoes(f)); }
  historico(f: FiltrosGestor) { return this.http.get<Historico[]>(`${this.base}/historico`, this.opcoes(f)); }
  relatorio(f: FiltrosGestor) { return this.http.get(`${this.base}/relatorio.csv`, { ...this.opcoes(f), responseType: 'blob' }); }
}
