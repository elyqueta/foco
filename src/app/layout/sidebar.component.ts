import { Component, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DataStore } from '../core/data.store';
import { AppIconComponent } from '../shared/ui/icon.component';
import { FocoLogoComponent } from '../shared/brand/foco-logo.component';
import { AppButtonComponent } from '../shared/ui/button.component';

interface NavItem {
  path: string;
  exact: boolean;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive, AppIconComponent, FocoLogoComponent, AppButtonComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private store = inject(DataStore);
  readonly moreOpen = signal(false);

  items: NavItem[] = [
    { path: '/', exact: true, label: 'Dashboard', icon: 'layout-grid' },
    { path: '/projetos', exact: false, label: 'Projetos', icon: 'folder-kanban' },
    { path: '/tarefas', exact: false, label: 'Tarefas', icon: 'square-check' },
    { path: '/calendario', exact: false, label: 'Calendário', icon: 'calendar-days' },
    { path: '/categorias', exact: false, label: 'Categorias', icon: 'tag' },
    { path: '/importar', exact: false, label: 'Importar', icon: 'upload' },
    { path: '/definicoes', exact: false, label: 'Definições', icon: 'settings' },
  ];

  isMobileOverflowItem(item: NavItem): boolean {
    return item.path === '/importar' || item.path === '/definicoes';
  }
}
