/** Declarações mínimas — o runtime de produção usa Postgres (pg). */
declare module 'sqlite' {
  export type Database = {
    get: (...args: any[]) => Promise<any>;
    all: (...args: any[]) => Promise<any[]>;
    run: (...args: any[]) => Promise<any>;
    exec: (...args: any[]) => Promise<any>;
  };
  export function open(config: any): Promise<Database>;
}

declare module 'sqlite3' {
  const sqlite3: any;
  export = sqlite3;
}
