import type { AdoConfig } from './types.js';

export class AdoClient {
  private baseUrl: string;
  private collection: string;
  private pat: string;
  private project: string;
  private apiVersion: string;
  private authHeader: string;

  constructor(config: AdoConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.collection = config.collection;
    this.pat = config.pat;
    this.project = config.project;
    this.apiVersion = config.apiVersion;
    this.authHeader = `Basic ${Buffer.from(`:${this.pat}`).toString('base64')}`;
  }

  async request<T = unknown>(
    path: string,
    options?: RequestInit & { project?: boolean },
  ): Promise<T> {
    const useProject = options?.project !== false;
    const projectSegment = useProject ? `/${this.project}` : '';
    const basePath = `${this.baseUrl}/${this.collection}${projectSegment}/_apis/${path}`;
    const separator = basePath.includes('?') ? '&' : '?';
    const url = `${basePath}${separator}api-version=${this.apiVersion}`;

    const { project: _, ...fetchOptions } = options ?? {};

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `ADO API error ${response.status} ${response.statusText}: ${errorBody}`,
      );
    }

    return response.json() as Promise<T>;
  }

  async requestPatch<T = unknown>(
    path: string,
    body: unknown,
    options?: RequestInit & { project?: boolean },
  ): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json-patch+json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
  }

  getProject(): string {
    return this.project;
  }
}
