import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Categoria { id: number; nome: string; }
export interface Ocorrencia {
  id: number; usuarioId: number; categoriaId: number; categoria: string;
  descricao: string; endereco: string | null; bairro: string | null;
  latitude: number; longitude: number; foto: string | null;
  status: string; criadaEm: string;
}
@Injectable({ providedIn: 'root' })
export class OcorrenciasService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private url = 'http://localhost:3000/api';
  categorias() { return this.http.get<Categoria[]>(`${this.url}/categorias`); }
  listar(filtros: { categoriaId?: string; status?: string; bairro?: string }) {
    let params = new HttpParams();
    if (filtros.categoriaId) params = params.set('categoriaId', filtros.categoriaId);
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.bairro) params = params.set('bairro', filtros.bairro);
    return this.http.get<Ocorrencia[]>(`${this.url}/ocorrencias`, { headers: this.headers(), params });
  }
  criar(dados: FormData) {
    return this.http.post<{ id: number; status: string; mensagem: string }>(`${this.url}/ocorrencias`, dados, { headers: this.headers() });
  }
  private headers() { return new HttpHeaders({ Authorization: `Bearer ${this.auth.tokenAtual()}` }); }
}
