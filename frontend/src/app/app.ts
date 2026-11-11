import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, type CadastroResposta } from './auth.service';
import { Observable } from 'rxjs';
import {
  OcorrenciasService,
  type Categoria,
  type Ocorrencia
} from './ocorrencias.service';
import { MapaComponent } from './mapa.component';
import { PainelGestorComponent } from './painel-gestor.component';
import {
  InteracoesService,
  type Comentario,
  type Notificacao
} from './interacoes.service';

type Tela = 'inicio' | 'login' | 'cadastro';
type Aba = 'lista' | 'registrar' | 'minhas' | 'avisos' | 'gestor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    MapaComponent,
    PainelGestorComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  // Serviços
  auth = inject(AuthService);
  api = inject(OcorrenciasService);
  interacoes = inject(InteracoesService);

  // Estados da aplicação
  tela = signal<Tela>('inicio');
  aba = signal<Aba>('lista');

  mensagem = signal('');
  carregando = signal(false);

  // Dados da aplicação
  municipios = signal<{ id: number; nome: string; uf: string }[]>([]);
  categorias = signal<Categoria[]>([]);
  ocorrencias = signal<Ocorrencia[]>([]);

  notificacoes = signal<Notificacao[]>([]);
  comentarios = signal<Comentario[]>([]);

  ocorrenciaAberta = signal<number | null>(null);

  // Campos de autenticação
  nome = '';
  email = '';
  senha = '';
  // Mostrar ou ocultar senhas
  mostrarSenha = false;
  mostrarNovaSenha = false;
  mostrarConfirmacaoSenha = false;

  // Recuperação de senha
  modoRecuperacao = false;
  codigoRecuperacao = '';
  novaSenha = '';
  confirmarNovaSenha = '';

  // Código gerado no cadastro ou solicitado pelo usuário
  codigoRecuperacaoGerado = '';
  municipioId = 0;

  // Campos de ocorrência
  categoriaId = 0;
  descricao = '';
  endereco = '';
  bairro = '';

  latitude: number | null = null;
  longitude: number | null = null;

  foto: File | null = null;

  // Filtros
  filtroCategoria = '';
  filtroStatus = '';
  filtroBairro = '';

  // Interações
  textoComentario = '';
  statusNovo = 'em_analise';

  // Inicialização
  ngOnInit(): void {
    this.auth.municipios().subscribe({
      next: (dados) => {
        this.municipios.set(dados);

        if (dados.length > 0) {
          this.municipioId = dados[0].id;
        }
      },
      error: (erro: unknown) => {
        console.error('Erro ao carregar municípios:', erro);
        this.mensagem.set('Verifique a API e o banco de dados.');
      }
    });

    this.api.categorias().subscribe({
      next: (dados) => {
        this.categorias.set(dados);

        if (dados.length > 0) {
          this.categoriaId = dados[0].id;
        }
      },
      error: (erro: unknown) => {
        console.error('Erro ao carregar categorias:', erro);
        this.mensagem.set('Não foi possível carregar as categorias.');
      }
    });
  }

  // Tratamento de erros
  mensagemErro(erro: unknown, mensagemPadrao: string): string {
    if (
      typeof erro === 'object' &&
      erro !== null &&
      'error' in erro
    ) {
      const resposta = erro.error;

      if (
        typeof resposta === 'object' &&
        resposta !== null &&
        'erro' in resposta &&
        typeof resposta.erro === 'string'
      ) {
        return resposta.erro;
      }
    }

    return mensagemPadrao;
  }

  // Navegação entre telas
  mudarTela(tela: Tela): void {
    this.tela.set(tela);
    this.mensagem.set('');
    this.senha = '';
  }

  selecionarAba(aba: Aba): void {
    this.aba.set(aba);
    this.mensagem.set('');

    if (aba === 'avisos') {
      this.carregarNotificacoes();
    } else if (aba !== 'registrar' && aba !== 'gestor') {
      this.listar();
    }
  }

  // Login e cadastro

  enviar(): void {
    this.mensagem.set('');
    this.erroLogin.set(false);
    this.carregando.set(true);

    const ehCadastro = this.tela() === 'cadastro';

    const pedido: Observable<unknown> = ehCadastro
      ? this.auth.cadastrar({
        nome: this.nome,
        email: this.email,
        senha: this.senha,
        municipioId: Number(this.municipioId)
      })
      : this.auth.entrar(this.email, this.senha);

    pedido.subscribe({
      next: (resposta: unknown) => {
        this.carregando.set(false);
        this.senha = '';

        if (ehCadastro) {
          const cadastro = resposta as CadastroResposta;

          this.codigoRecuperacaoGerado = cadastro.codigoRecuperacao;

          this.mudarTela('login');
          this.mensagem.set(
            'Conta criada! Guarde seu código de recuperação antes de fazer login.'
          );
        } else {
          this.mensagem.set('Login realizado!');
          this.listar();
          this.carregarNotificacoes();
        }
      },
      error: (erro: unknown) => {
        this.carregando.set(false);

        if (!ehCadastro) {
          this.erroLogin.set(true);
        }

        this.mensagem.set(
          this.mensagemErro(erro, 'Erro na operação.')
        );
      }
    });
  }

  // Listagem de ocorrências
  listar(): void {
    this.api.listar({
      categoriaId: this.filtroCategoria,
      status: this.filtroStatus,
      bairro: this.filtroBairro
    }).subscribe({
      next: (dados) => {
        this.ocorrencias.set(dados);
      },
      error: (erro: unknown) => {
        this.mensagem.set(
          this.mensagemErro(
            erro,
            'Não foi possível carregar as ocorrências.'
          )
        );
      }
    });
  }

  // Localização no mapa
  marcarPosicao(pos: {
    latitude: number;
    longitude: number;
  }): void {
    this.latitude = pos.latitude;
    this.longitude = pos.longitude;
  }

  // Seleção de foto
  selecionarFoto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.foto = input.files?.[0] ?? null;
  }

  // Cadastro de ocorrência
  registrar(): void {
    if (this.latitude === null || this.longitude === null) {
      this.mensagem.set('Clique no mapa para marcar o local.');
      return;
    }

    if (
      this.foto &&
      (
        this.foto.size > 5 * 1024 * 1024 ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(this.foto.type)
      )
    ) {
      this.mensagem.set('Escolha JPG, PNG ou WebP de até 5 MB.');
      return;
    }

    const dados = new FormData();

    dados.append('categoriaId', String(this.categoriaId));
    dados.append('descricao', this.descricao);
    dados.append('endereco', this.endereco);
    dados.append('bairro', this.bairro);
    dados.append('latitude', String(this.latitude));
    dados.append('longitude', String(this.longitude));

    if (this.foto) {
      dados.append('foto', this.foto);
      dados.append('fotoEnviada', 'sim');
    }

    this.carregando.set(true);

    this.api.criar(dados).subscribe({
      next: (resposta) => {
        this.carregando.set(false);

        this.descricao = '';
        this.endereco = '';
        this.bairro = '';
        this.foto = null;

        this.mensagem.set(
          `Ocorrência #${resposta.id} registrada!`
        );

        this.aba.set('minhas');
        this.listar();
      },
      error: (erro: unknown) => {
        this.carregando.set(false);

        this.mensagem.set(
          this.mensagemErro(erro, 'Erro ao registrar.')
        );
      }
    });
  }

  // Minhas ocorrências
  minhas(): Ocorrencia[] {
    return this.ocorrencias().filter(
      (ocorrencia) =>
        ocorrencia.usuarioId === this.auth.usuario()?.id
    );
  }

  // Comentários
  abrirComentarios(id: number): void {
    if (this.ocorrenciaAberta() === id) {
      this.ocorrenciaAberta.set(null);
      return;
    }

    this.ocorrenciaAberta.set(id);

    this.interacoes.comentarios(id).subscribe({
      next: (dados) => {
        this.comentarios.set(dados);
      },
      error: (erro: unknown) => {
        console.error('Erro ao carregar comentários:', erro);
        this.mensagem.set('Não foi possível carregar comentários.');
      }
    });
  }

  comentar(id: number): void {
    if (!this.textoComentario.trim()) {
      this.mensagem.set('Digite um comentário antes de enviar.');
      return;
    }

    this.interacoes.comentar(
      id,
      this.textoComentario
    ).subscribe({
      next: () => {
        this.textoComentario = '';

        this.interacoes.comentarios(id).subscribe({
          next: (dados) => this.comentarios.set(dados),
          error: (erro: unknown) => {
            console.error('Erro ao atualizar comentários:', erro);
          }
        });
      },
      error: (erro: unknown) => {
        this.mensagem.set(
          this.mensagemErro(erro, 'Erro ao comentar.')
        );
      }
    });
  }

  // Apoios
  apoiar(id: number): void {
    this.interacoes.apoiar(id).subscribe({
      next: () => {
        this.mensagem.set('Você apoiou esta ocorrência!');
      },
      error: (erro: unknown) => {
        this.mensagem.set(
          this.mensagemErro(erro, 'Erro ao apoiar.')
        );
      }
    });
  }

  removerApoio(id: number): void {
    this.interacoes.removerApoio(id).subscribe({
      next: () => {
        this.mensagem.set('Apoio removido.');
      },
      error: (erro: unknown) => {
        this.mensagem.set(
          this.mensagemErro(erro, 'Erro ao remover apoio.')
        );
      }
    });
  }

  // Notificações
  carregarNotificacoes(): void {
    this.interacoes.notificacoes().subscribe({
      next: (dados) => {
        this.notificacoes.set(dados);
      },
      error: (erro: unknown) => {
        console.error('Erro ao carregar notificações:', erro);
        this.mensagem.set('Não foi possível carregar notificações.');
      }
    });
  }

  lerNotificacao(id: number): void {
    this.interacoes.marcarLida(id).subscribe({
      next: () => {
        this.carregarNotificacoes();
      },
      error: (erro: unknown) => {
        console.error('Erro ao marcar notificação:', erro);
        this.mensagem.set('Não foi possível marcar como lida.');
      }
    });
  }

  // Painel do gestor
  atualizarStatus(id: number): void {
    this.interacoes.mudarStatus(
      id,
      this.statusNovo
    ).subscribe({
      next: () => {
        this.mensagem.set('Status atualizado.');
        this.listar();
      },
      error: (erro: unknown) => {
        this.mensagem.set(
          this.mensagemErro(erro, 'Erro ao atualizar status.')
        );
      }
    });
  }

  // Sair da conta
  sair(): void {
    this.auth.sair();
    this.ocorrencias.set([]);
    this.comentarios.set([]);
    this.notificacoes.set([]);
    this.ocorrenciaAberta.set(null);
    this.mudarTela('inicio');
    this.mensagem.set('Você saiu da conta.');
  }


  recuperarSenha(): void {
    this.mensagem.set('');

    if (this.novaSenha.length < 10) {
      this.mensagem.set('A nova senha precisa ter pelo menos 10 caracteres.');
      return;
    }

    if (this.novaSenha !== this.confirmarNovaSenha) {
      this.mensagem.set('As senhas não coincidem.');
      return;
    }

    this.carregando.set(true);

    this.auth.recuperarSenha(
      this.email,
      this.codigoRecuperacao,
      this.novaSenha
    ).subscribe({
      next: (resposta) => {
        this.carregando.set(false);
        this.modoRecuperacao = false;
        this.codigoRecuperacao = '';
        this.novaSenha = '';
        this.confirmarNovaSenha = '';
        this.mensagem.set(resposta.mensagem || 'Senha redefinida! Faça login.');
      },
      error: (erro: unknown) => {
        this.carregando.set(false);
        this.mensagem.set(
          this.mensagemErro(erro, 'Não foi possível recuperar a senha.')
        );
      }
    });
  }

  gerarCodigoRecuperacao(): void {
    this.mensagem.set('');
    this.carregando.set(true);

    this.auth.gerarCodigoRecuperacao().subscribe({
      next: (resposta) => {
        this.carregando.set(false);
        this.codigoRecuperacaoGerado = resposta.codigoRecuperacao;
        this.mensagem.set('Novo código gerado. Guarde-o em local seguro.');
      },
      error: (erro: unknown) => {
        this.carregando.set(false);
        this.mensagem.set(
          this.mensagemErro(erro, 'Não foi possível gerar o código.')
        );
      }
    });
  }
  erroLogin = signal(false);

}
