import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DataStore } from '../core/data.store';
import { FocoIconComponent } from '../shared/brand/foco-icon.component';
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
  imports: [RouterLink, RouterLinkActive, FocoIconComponent, FocoLogoComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private store = inject(DataStore);

  items: NavItem[] = [
    { path: '/', exact: true, label: 'Dashboard', icon: 'dashboard' },
    { path: '/projetos', exact: false, label: 'Projetos', icon: 'folder' },
    { path: '/tarefas', exact: false, label: 'Tarefas', icon: 'check-square' },
    { path: '/calendario', exact: false, label: 'Calendário', icon: 'calendar' },
    { path: '/categorias', exact: false, label: 'Categorias', icon: 'tag' },
    { path: '/importar', exact: false, label: 'Importar', icon: 'upload' },
    { path: '/definicoes', exact: false, label: 'Definições', icon: 'settings' },
  ];
}
