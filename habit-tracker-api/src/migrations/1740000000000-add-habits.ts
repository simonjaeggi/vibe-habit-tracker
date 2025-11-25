import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class AddHabits1740000000000 implements MigrationInterface {
  private uuidColumnDefaults(connectionType: string) {
    const isSqlite = connectionType === 'sqlite';

    return {
      type: isSqlite ? 'varchar' : 'uuid',
      isPrimary: true,
      generationStrategy: 'uuid' as const,
      isGenerated: true,
      default: isSqlite
        ? "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))"
        : 'uuid_generate_v4()',
    };
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const connectionType = queryRunner.connection.options.type;
    const uuidDefaults = this.uuidColumnDefaults(connectionType);

    await queryRunner.createTable(
      new Table({
        name: 'habits',
        columns: [
          {
            name: 'id',
            ...uuidDefaults,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'recurrence',
            type: 'varchar',
          },
          {
            name: 'customIntervalDays',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'allowText',
            type: 'boolean',
            default: false,
          },
          {
            name: 'requireText',
            type: 'boolean',
            default: false,
          },
          {
            name: 'allowPicture',
            type: 'boolean',
            default: false,
          },
          {
            name: 'requirePicture',
            type: 'boolean',
            default: false,
          },
          {
            name: 'allowVoiceMemo',
            type: 'boolean',
            default: false,
          },
          {
            name: 'requireVoiceMemo',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: connectionType === 'sqlite' ? 'datetime' : 'timestamp',
            default: connectionType === 'sqlite' ? "datetime('now')" : 'now()',
          },
          {
            name: 'updatedAt',
            type: connectionType === 'sqlite' ? 'datetime' : 'timestamp',
            default: connectionType === 'sqlite' ? "datetime('now')" : 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'habit_entries',
        columns: [
          {
            name: 'id',
            ...uuidDefaults,
          },
          {
            name: 'habitId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'entryDate',
            type: 'date',
          },
          {
            name: 'textContent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'pictureUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'voiceMemoUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: connectionType === 'sqlite' ? 'datetime' : 'timestamp',
            default: connectionType === 'sqlite' ? "datetime('now')" : 'now()',
          },
          {
            name: 'updatedAt',
            type: connectionType === 'sqlite' ? 'datetime' : 'timestamp',
            default: connectionType === 'sqlite' ? "datetime('now')" : 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'habit_entries',
      new TableUnique({
        name: 'UQ_habit_entries_habit_date',
        columnNames: ['habitId', 'entryDate'],
      }),
    );

    await queryRunner.createForeignKey(
      'habits',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'habits',
      new TableIndex({
        name: 'IDX_habits_user',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createForeignKey(
      'habit_entries',
      new TableForeignKey({
        columnNames: ['habitId'],
        referencedTableName: 'habits',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'habit_entries',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'habit_entries',
      new TableIndex({
        name: 'IDX_habit_entries_user',
        columnNames: ['userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('habit_entries');
    await queryRunner.dropTable('habits');
  }
}
