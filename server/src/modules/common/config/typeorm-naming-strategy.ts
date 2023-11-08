import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';

const MAX_POSTGRES_INDEX_LEN = 60;

export class TypeOrmNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  private convertToString(tableOrName: Table | string) {
    return typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
  }

  primaryKeyName(tableOrName: Table | string, columnNames: string[]) {
    return `PK_${this.convertToString(tableOrName)}_${columnNames.join('_')}`.substring(0, MAX_POSTGRES_INDEX_LEN);
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]) {
    return `UQ_${this.convertToString(tableOrName)}_${columnNames.join('_')}`.substring(0, MAX_POSTGRES_INDEX_LEN);
  }

  indexName(tableOrName: Table | string, columnNames: string[], where?: string): string {
    return `IDX_${this.convertToString(tableOrName)}_${columnNames.join('_')}${where ? `_${where}` : ''}`.substring(
      0,
      MAX_POSTGRES_INDEX_LEN,
    );
  }

  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    referencedTablePath?: string,
    referencedColumnNames?: string[],
  ) {
    let name = `FK_${this.convertToString(tableOrName)}_${columnNames.join('_')}`;
    if (referencedTablePath) {
      name = name + `_${referencedTablePath}`;
    }
    if (referencedColumnNames) {
      name = name + `_${referencedColumnNames.join('_')}`;
    }

    return name.substring(0, MAX_POSTGRES_INDEX_LEN);
  }
}
