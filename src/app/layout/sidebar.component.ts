import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DataStore } from '../core/data.store';
import { AppIconComponent } from '../shared/ui/icon.component';
import { FocoLogoComponent } from '../shared/brand/foco-logo.component';

interface NavItem {
  path: string;
  exact: boolean;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AppIconComponent, FocoLogoComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private store = inject(DataStore);

  items: NavItem[] = [
    { path: '/', exact: true, label: 'Dashboard', icon: 'layout-grid' },
    { path: '/projetos', exact: false, label: 'Projetos', icon: 'folder-kanban' },
    { path: '/tarefas', exact: false, label: 'Tarefas', icon: 'square-check' },
    { path: '/calendario', exact: false, label: 'Calendário', icon: 'calendar-days' },
    { path: '/categorias', exact: false, label: 'Categorias', icon: 'tag' },
    { path: '/importar', exact: false, label: 'Importar', icon: 'upload' },
    { path: '/definicoes', exact: false, label: 'Definições', icon: 'settings' },
  ];
}
