import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, inject, signal, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import * as L from 'leaflet';
import 'leaflet.heat';
import { GestorService, type FiltrosGestor, type Indicadores, type Historico } from './gestor.service';
import type { Categoria } from './ocorrencias.service';

Chart.register(...registerables);

@Component({
  selector: 'app-painel-gestor', standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './painel-gestor.component.html',
  styleUrl: './painel-gestor.component.css'
})
export class PainelGestorComponent implements AfterViewInit, OnDestroy {
  private api = inject(GestorService);
  categorias = input<Categoria[]>([]);
  dados = signal<Indicadores | null>(null);
  historico = signal<Historico[]>([]);
  erro = signal('');
  carregando = signal(false);
  filtros: FiltrosGestor = { categoriaId: '', status: '', bairro: '', inicio: '', fim: '' };
  @ViewChild('graficoCategoria') graficoCategoria?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoEvolucao') graficoEvolucao?: ElementRef<HTMLCanvasElement>;
  @ViewChild('mapaCalor') mapaCalor?: ElementRef<HTMLDivElement>;
  private graficos: Chart[] = [];
  private mapa?: L.Map;
  private calor?: L.Layer;
  private inicializado = false;

  ngAfterViewInit() { this.inicializado = true; this.carregar(); }
  carregar() {
    this.erro.set(''); this.carregando.set(true);
    this.api.indicadores(this.filtros).subscribe({
      next: dados => {
        this.dados.set(dados); this.carregando.set(false);
        // Aguarda Angular criar os elementos do gráfico e do mapa.
        setTimeout(() => this.desenhar(dados), 0);
      },
      error: () => { this.carregando.set(false); this.erro.set('Não foi possível carregar indicadores.'); }
    });
    this.api.historico(this.filtros).subscribe({
      next: dados => this.historico.set(dados),
      error: () => this.erro.set('Não foi possível carregar o histórico.')
    });
  }
  private desenhar(dados: Indicadores) {
    if (!this.inicializado || !this.graficoCategoria || !this.graficoEvolucao || !this.mapaCalor) return;
    this.graficos.forEach(g => g.destroy());
    this.graficos = [];
    this.graficos.push(new Chart(this.graficoCategoria.nativeElement, {
      type: 'bar', data: {
        labels: dados.categorias.map(c => c.nome),
        datasets: [{ label: 'Ocorrências', data: dados.categorias.map(c => c.total), backgroundColor: '#168477' }]
      }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    }));
    this.graficos.push(new Chart(this.graficoEvolucao.nativeElement, {
      type: 'line', data: {
        labels: dados.evolucao.map(e => e.mes),
        datasets: [{ label: 'Ocorrências por mês', data: dados.evolucao.map(e => e.total),
          borderColor: '#168477', backgroundColor: '#d6f0eb', tension: 0.2 }]
      }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    }));
    if (!this.mapa) {
      this.mapa = L.map(this.mapaCalor.nativeElement).setView([-23.5015, -47.4526], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
      }).addTo(this.mapa);
    }
    if (this.calor) this.mapa.removeLayer(this.calor);
    // HeatLatLngTuple exige o terceiro elemento (intensidade) obrigatorio.
    const pontos: L.HeatLatLngTuple[] = dados.pontos.map(p => [p.latitude, p.longitude, 1]);
    this.calor = this.pluginCalor().heatLayer(pontos, { radius: 25, blur: 18, maxZoom: 17 }).addTo(this.mapa);
    if (pontos.length) this.mapa.fitBounds(L.latLngBounds(pontos), { maxZoom: 13, padding: [20, 20] });
    setTimeout(() => this.mapa?.invalidateSize(), 100);
  }
  /**
   * leaflet.heat 0.2.0 e um plugin legado: ele se instala no global `L`
   * (window.L), e nao no namespace do modulo ES. Como o Leaflet e importado
   * como modulo, o namespace e uma copia e nao recebe `heatLayer` — por isso
   * chamamos o plugin atraves do global.
   */
  private pluginCalor() {
    return (window as unknown as {
      L: { heatLayer(pontos: L.HeatLatLngTuple[], opcoes: L.HeatMapOptions): L.HeatLayer };
    }).L;
  }
  exportar() {
    this.api.relatorio(this.filtros).subscribe({
      next: arquivo => {
        const url = URL.createObjectURL(arquivo);
        const link = document.createElement('a');
        link.href = url; link.download = 'nekourban-relatorio.csv'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => this.erro.set('Não foi possível baixar o relatório.')
    });
  }
  ngOnDestroy() { this.inicializado = false; this.graficos.forEach(g => g.destroy()); this.mapa?.remove(); }
}
