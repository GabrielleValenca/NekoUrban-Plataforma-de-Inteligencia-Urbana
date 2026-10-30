import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
export interface Usuario { id: number; nome: string; email: string; municipioId: number; perfil: 'cidadao' | 'gestor'; }
interface LoginResposta { token: string; usuario: Usuario; }
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private url = 'http://localhost:3000/api';
  // Por simplicidade, token só em memória: atualizar a página exige novo login.
  private token = '';
  usuario = signal<Usuario | null>(null);
  municipios(): Observable<{ id: number; nome: string; uf: string }[]> {
    return this.http.get<{ id: number; nome: string; uf: string }[]>(`${this.url}/municipios`);
  }
  cadastrar(dados: { nome: string; email: string; senha: string; municipioId: number }) {
    return this.http.post(`${this.url}/auth/cadastro`, dados);
  }
  entrar(email: string, senha: string) {
    return this.http.post<LoginResposta>(`${this.url}/auth/login`, { email, senha }).pipe(
      tap(resposta => { this.token = resposta.token; this.usuario.set(resposta.usuario); })
    );
  }
  perfil() {
    return this.http.get<Usuario>(`${this.url}/auth/me`, { headers: this.headers() });
  }
  testarGestor() {
    return this.http.get<{ mensagem: string }>(`${this.url}/gestor/teste`, { headers: this.headers() });
  }
  tokenAtual() { return this.token; }
  sair() { this.token = ''; this.usuario.set(null); }
  private headers() { return new HttpHeaders({ Authorization: `Bearer ${this.token}` }); }
}
