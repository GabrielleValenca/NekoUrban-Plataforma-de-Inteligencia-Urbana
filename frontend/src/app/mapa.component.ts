import { Component, ElementRef, EventEmitter, Input, Output, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import type { Ocorrencia } from './ocorrencias.service';

@Component({ selector: 'app-mapa', standalone: true, template: '<div #mapa class="mapa" aria-label="Mapa interativo"></div>', styles: ['.mapa{height:340px;border-radius:12px;z-index:0}'] })
export class MapaComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapa', { static: true }) elemento!: ElementRef<HTMLDivElement>;
  @Input() selecionavel = false;
  @Input() ocorrencias: Ocorrencia[] = [];
  @Output() posicao = new EventEmitter<{ latitude: number; longitude: number }>();
  private mapa?: L.Map;
  private marcadores = L.layerGroup();
  private ponto?: L.CircleMarker;
  ngAfterViewInit() {
    this.mapa = L.map(this.elemento.nativeElement).setView([-23.5015, -47.4526], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
    }).addTo(this.mapa);
    this.marcadores.addTo(this.mapa);
    if (this.selecionavel) this.mapa.on('click', evento => {
      this.ponto?.remove();
      this.ponto = L.circleMarker(evento.latlng, { radius: 9, color: '#0c7669' }).addTo(this.mapa!);
      this.posicao.emit({ latitude: evento.latlng.lat, longitude: evento.latlng.lng });
    });
    this.atualizar();
    setTimeout(() => this.mapa?.invalidateSize(), 100);
  }
  ngOnChanges(_changes: SimpleChanges) { this.atualizar(); }
  private atualizar() {
    if (!this.mapa) return;
    this.marcadores.clearLayers();
    for (const o of this.ocorrencias) {
      // Usar texto puro evita interpretar HTML vindo dos registros.
      const texto = `${o.categoria} — ${o.status}`;
      L.circleMarker([o.latitude, o.longitude], { radius: 8, color: '#176e65' })
        .bindTooltip(texto).addTo(this.marcadores);
    }
  }
  ngOnDestroy() { this.mapa?.remove(); }
}
