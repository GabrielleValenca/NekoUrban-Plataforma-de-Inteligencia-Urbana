import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { OcorrenciasService, type Categoria, type Ocorrencia } from './ocorrencias.service';
import { MapaComponent } from './mapa.component';
import { PainelGestorComponent } from './painel-gestor.component';
import { InteracoesService, type Comentario, type Notificacao } from './interacoes.service';

@Component({ selector: 'app-root', standalone: true, imports: [FormsModule, MapaComponent, PainelGestorComponent, DatePipe], templateUrl: './app.html', styleUrl: './app.css' })
export class App implements OnInit {
  auth = inject(AuthService);
  api = inject(OcorrenciasService);
  interacoes = inject(InteracoesService);
  notificacoes = signal<Notificacao[]>([]);
  comentarios = signal<Comentario[]>([]);
  ocorrenciaAberta = signal<number | null>(null);
  textoComentario = '';
  statusNovo = 'em_analise';
  tela = signal<'login' | 'cadastro'>('login');
  aba = signal<'lista' | 'registrar' | 'minhas' | 'avisos' | 'gestor'>('lista');
  mensagem = signal(''); carregando = signal(false);
  municipios = signal<{ id: number; nome: string; uf: string }[]>([]);
  categorias = signal<Categoria[]>([]); ocorrencias = signal<Ocorrencia[]>([]);
  nome = ''; email = ''; senha = ''; municipioId = 0;
  categoriaId = 0; descricao = ''; endereco = ''; bairro = '';
  latitude: number | null = null; longitude: number | null = null; foto: File | null = null;
  filtroCategoria = ''; filtroStatus = ''; filtroBairro = '';
  ngOnInit() {
    this.auth.municipios().subscribe({
      next: dados => { this.municipios.set(dados); if (dados.length) this.municipioId = dados[0].id; },
      error: () => this.mensagem.set('Verifique a API e o banco de dados.')
    });
    this.api.categorias().subscribe({ next: dados => { this.categorias.set(dados); if (dados.length) this.categoriaId = dados[0].id; } });
  }
  mudarTela(tela: 'login' | 'cadastro') { this.tela.set(tela); this.mensagem.set(''); this.senha = ''; }
  enviar() {
    this.mensagem.set(''); this.carregando.set(true);
    const pedido = this.tela() === 'cadastro'
      ? this.auth.cadastrar({ nome: this.nome, email: this.email, senha: this.senha, municipioId: Number(this.municipioId) })
      : this.auth.entrar(this.email, this.senha);
    pedido.subscribe({
      next: () => {
        this.carregando.set(false); this.senha = '';
        if (this.tela() === 'cadastro') { this.mudarTela('login'); this.mensagem.set('Conta criada! Faça login.'); }
        else { this.mensagem.set('Login realizado!'); this.listar(); this.carregarNotificacoes(); }
      },
      error: erro => { this.carregando.set(false); this.mensagem.set(erro.error?.erro ?? 'Erro na operação.'); }
    });
  }
  selecionarAba(aba: 'lista' | 'registrar' | 'minhas' | 'avisos' | 'gestor') { this.aba.set(aba); this.mensagem.set(''); if (aba === 'avisos') this.carregarNotificacoes(); else if (aba !== 'registrar' && aba !== 'gestor') this.listar(); }
  listar() {
    this.api.listar({ categoriaId: this.filtroCategoria, status: this.filtroStatus, bairro: this.filtroBairro }).subscribe({
      next: dados => this.ocorrencias.set(dados),
      error: erro => this.mensagem.set(erro.error?.erro ?? 'Não foi possível carregar as ocorrências.')
    });
  }
  marcarPosicao(pos: { latitude: number; longitude: number }) { this.latitude = pos.latitude; this.longitude = pos.longitude; }
  selecionarFoto(evento: Event) { this.foto = (evento.target as HTMLInputElement).files?.[0] ?? null; }
  registrar() {
    if (this.latitude === null || this.longitude === null) { this.mensagem.set('Clique no mapa para marcar o local.'); return; }
    if (this.foto && (this.foto.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(this.foto.type))) {
      this.mensagem.set('Escolha JPG, PNG ou WebP de até 5 MB.'); return;
    }
    const dados = new FormData();
    dados.append('categoriaId', String(this.categoriaId)); dados.append('descricao', this.descricao);
    dados.append('endereco', this.endereco); dados.append('bairro', this.bairro);
    dados.append('latitude', String(this.latitude)); dados.append('longitude', String(this.longitude));
    if (this.foto) { dados.append('foto', this.foto); dados.append('fotoEnviada', 'sim'); }
    this.carregando.set(true);
    this.api.criar(dados).subscribe({
      next: resposta => { this.carregando.set(false); this.descricao = ''; this.endereco = ''; this.bairro = ''; this.foto = null;
        this.mensagem.set(`Ocorrência #${resposta.id} registrada!`); this.aba.set('minhas'); this.listar(); },
      error: erro => { this.carregando.set(false); this.mensagem.set(erro.error?.erro ?? 'Erro ao registrar.'); }
    });
  }
  minhas() { return this.ocorrencias().filter(o => o.usuarioId === this.auth.usuario()?.id); }
  abrirComentarios(id: number) {
    if (this.ocorrenciaAberta() === id) { this.ocorrenciaAberta.set(null); return; }
    this.ocorrenciaAberta.set(id);
    this.interacoes.comentarios(id).subscribe({
      next: dados => this.comentarios.set(dados),
      error: () => this.mensagem.set('Não foi possível carregar comentários.')
    });
  }
  comentar(id: number) {
    this.interacoes.comentar(id, this.textoComentario).subscribe({
      next: () => { this.textoComentario = ''; this.interacoes.comentarios(id).subscribe(dados => this.comentarios.set(dados)); },
      error: erro => this.mensagem.set(erro.error?.erro ?? 'Erro ao comentar.')
    });
  }
  apoiar(id: number) {
    this.interacoes.apoiar(id).subscribe({
      next: () => this.mensagem.set('Você apoiou esta ocorrência!'),
      error: erro => this.mensagem.set(erro.error?.erro ?? 'Erro ao apoiar.')
    });
  }
  removerApoio(id: number) {
    this.interacoes.removerApoio(id).subscribe({
      next: () => this.mensagem.set('Apoio removido.'),
      error: erro => this.mensagem.set(erro.error?.erro ?? 'Erro ao remover apoio.')
    });
  }
  carregarNotificacoes() {
    this.interacoes.notificacoes().subscribe({
      next: dados => this.notificacoes.set(dados),
      error: () => this.mensagem.set('Não foi possível carregar notificações.')
    });
  }
  lerNotificacao(id: number) {
    this.interacoes.marcarLida(id).subscribe({
      next: () => this.carregarNotificacoes(),
      error: () => this.mensagem.set('Não foi possível marcar como lida.')
    });
  }
  atualizarStatus(id: number) {
    this.interacoes.mudarStatus(id, this.statusNovo).subscribe({
      next: () => { this.mensagem.set('Status atualizado.'); this.listar(); },
      error: erro => this.mensagem.set(erro.error?.erro ?? 'Erro ao atualizar status.')
    });
  }
  sair() { this.auth.sair(); this.ocorrencias.set([]); this.mensagem.set('Você saiu da conta.'); }
}
