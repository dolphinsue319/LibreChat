export interface AdoConfig {
  baseUrl: string;
  collection: string;
  pat: string;
  project: string;
  apiVersion: string;
}

export interface WorkItemField {
  op: 'add' | 'replace' | 'remove' | 'test';
  path: string;
  value: unknown;
}

export interface WiqlResult {
  workItems: Array<{ id: number; url: string }>;
}

export interface WorkItem {
  id: number;
  rev: number;
  fields: Record<string, unknown>;
  url: string;
}

export interface GitRepository {
  id: string;
  name: string;
  url: string;
  defaultBranch: string;
  project: { id: string; name: string };
}

export interface PullRequest {
  pullRequestId: number;
  title: string;
  description: string;
  status: string;
  createdBy: { displayName: string };
  sourceRefName: string;
  targetRefName: string;
  url: string;
}

export interface Pipeline {
  id: number;
  name: string;
  folder: string;
  url: string;
}

export interface PipelineRun {
  id: number;
  name: string;
  state: string;
  result: string;
  createdDate: string;
  finishedDate: string;
  url: string;
}

export interface Iteration {
  id: string;
  name: string;
  path: string;
  attributes: {
    startDate: string;
    finishDate: string;
    timeFrame: string;
  };
}

export interface TeamMember {
  identity: {
    displayName: string;
    uniqueName: string;
    id: string;
  };
}

export interface AdoListResponse<T> {
  count: number;
  value: T[];
}
