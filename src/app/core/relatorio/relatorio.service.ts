import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProductivityReportResponse,
  ReportRequestParams,
} from './relatorio.models';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl; // '/api/v1'

  async getProductivityReport(params: ReportRequestParams): Promise<ProductivityReportResponse> {
    const httpParams = new HttpParams({ fromObject: params as unknown as Record<string, string> });
    return firstValueFrom(
      this.http.get<ProductivityReportResponse>(`${this.base}/exports/productivity-report`, {
        params: httpParams,
      })
    );
  }
}
