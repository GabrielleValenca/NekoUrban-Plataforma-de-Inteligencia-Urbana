
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  municipioId: number;
  perfil: 'cidadao' | 'gestor';
}

export interface CadastroResposta {
  mensagem: string;
  codigoRecuperacao: string;
  usuario: Usuario;
}

export interface RecuperacaoResposta {
  mensagem: string;
}

interface LoginResposta {
  token: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private url =
    'http://localhost:3000/api';

  private token = '';

  usuario = signal<Usuario | null>(null);

  municipios(): Observable<{ id: number; nome: string; uf: string }[]> {
    return this.http.get<{ id: number; nome: string; uf: string }[]>(
      `${this.url}/municipios`
    );
  }

  cadastrar(dados: {
    nome: string;
    email: string;
    senha: string;
    municipioId: number;
  }): Observable<CadastroResposta> {
    return this.http.post<CadastroResposta>(
      `${this.url}/auth/cadastro`,
      dados
    );
  }

  entrar(email: string, senha: string): Observable<LoginResposta> {
    return this.http
      .post<LoginResposta>(`${this.url}/auth/login`, { email, senha })
      .pipe(
        tap(resposta => {
          this.token = resposta.token;
          this.usuario.set(resposta.usuario);
        })
      );
  }

  gerarCodigoRecuperacao(): Observable<{ codigoRecuperacao: string; mensagem: string }> {
    return this.http.post<{ codigoRecuperacao: string; mensagem: string }>(
      `${this.url}/auth/codigo-recuperacao`,
      {},
      { headers: this.headers() }
    );
  }


  recuperarSenha(
    email: string,
    novaSenha: string
  ): Observable<RecuperacaoResposta> {
    return this.http.post<RecuperacaoResposta>(
      `${this.url}/auth/recuperar-senha`,
      {
        email,
        novaSenha
      }
    );
  }

  perfil(): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${this.url}/auth/me`,
      { headers: this.headers() }
    );
  }

  testarGestor(): Observable<{ mensagem: string }> {
    return this.http.get<{ mensagem: string }>(
      `${this.url}/gestor/teste`,
      { headers: this.headers() }
    );
  }

  tokenAtual(): string {
    return this.token;
  }

  sair(): void {
    this.token = '';
    this.usuario.set(null);
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });
  }
}
