import Dexie, { Table } from 'dexie';

export interface FileInterface {
  id?: string;
  content: string;
}

export class AppDatabase extends Dexie {
  files!: Table<FileInterface>;

  constructor() {
    super('NujanFiles');
    this.version(1).stores({
      files: 'id, content',
    });
  }
}

export const fileSystem = new AppDatabase();
