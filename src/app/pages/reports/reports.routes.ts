import { Routes } from '@angular/router';

export const reportsRoutes: Routes = [
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports.component').then((module) => module.ReportsComponent),
    data: {
      title: 'Reportes inteligentes',
      subtitle: 'Consulta informacion del territorio en lenguaje natural y obten reportes al instante.',
    },
  },
];

