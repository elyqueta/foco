import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { ShellComponent } from './layout/shell.component';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { ProjectsPage } from './pages/projects/projects.page';
import { ProjectDetailPage } from './pages/project-detail/project-detail.page';
import { TasksPage } from './pages/tasks/tasks.page';
import { TaskDetailPage } from './pages/task-detail/task-detail.page';
import { ImportPage } from './pages/import/import.page';
import { CalendarPage } from './pages/calendar/calendar.page';
import { CalendarDayPage } from './pages/calendar/calendar-day.page';
import { SettingsPage } from './pages/settings/settings.page';
import { CategoriesPage } from './pages/categories/categories.page';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'projetos', loadComponent: () => import('./pages/projects/projects.page').then(m => m.ProjectsPage) },
      { path: 'projetos/:id', loadComponent: () => import('./pages/project-detail/project-detail.page').then(m => m.ProjectDetailPage) },
      { path: 'tarefas', loadComponent: () => import('./pages/tasks/tasks.page').then(m => m.TasksPage) },
      { path: 'tarefas/:id', loadComponent: () => import('./pages/task-detail/task-detail.page').then(m => m.TaskDetailPage) },
      { path: 'importar', loadComponent: () => import('./pages/import/import.page').then(m => m.ImportPage) },
      { path: 'calendario', loadComponent: () => import('./pages/calendar/calendar.page').then(m => m.CalendarPage) },
      { path: 'calendario/:date', loadComponent: () => import('./pages/calendar/calendar-day.page').then(m => m.CalendarDayPage) },
      { path: 'categorias', loadComponent: () => import('./pages/categories/categories.page').then(m => m.CategoriesPage) },
      { path: 'definicoes', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
