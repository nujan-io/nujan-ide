export interface IGitWorkerMessage<T> {
  type: 'init' | 'data' | 'error';
  payload?: {
    id?: string;
    data: T;
  };
}

export interface InitRepo {
  projectPath: string;
}
