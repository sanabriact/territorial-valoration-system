import { HttpErrorResponse } from '@angular/common/http';

export class ReportErrorMessageMapper {
  static toMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'La consulta esta vacia o malformada. Intenta escribir una pregunta mas especifica.';
    }

    if (error.status === 422) {
      return 'No pude asociar la consulta a un tipo de reporte. Prueba con ejemplos como: anotaciones por categoria este mes, top barrios con mas puntos criticos o anotaciones por entidad responsable.';
    }

    if (error.status === 404) {
      return 'No hay registros para los filtros indicados en la consulta.';
    }

    return 'No se pudo generar el reporte en este momento. Intenta nuevamente.';
  }
}

