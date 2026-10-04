import { NgModule } from '@angular/core';
import { LucideAngularModule, LayoutGrid, FolderKanban, SquareCheck, CalendarDays, Upload, Settings, Search, Download } from 'lucide-angular';

@NgModule({
  imports: [
    LucideAngularModule.pick({
      'layout-grid': LayoutGrid,
      'folder-kanban': FolderKanban,
      'square-check': SquareCheck,
      'calendar-days': CalendarDays,
      'upload': Upload,
      'settings': Settings,
      'search': Search,
      'download': Download,
    }),
  ],
})
export class LucideIconsModule {}
