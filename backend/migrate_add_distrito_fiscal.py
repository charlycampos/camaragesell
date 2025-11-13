"""
Script de migración para agregar soporte de DistritoFiscal
Agrega la tabla distritos_fiscales y la columna distrito_fiscal_id a las tablas relacionadas
"""
import sqlite3
from pathlib import Path

# Ubicación de la base de datos
DB_PATH = Path(__file__).parent / "sigeca.db"

def migrate():
    """Ejecuta la migración de base de datos"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Iniciando migración...")

        # 1. Crear tabla distritos_fiscales si no existe
        print("1. Creando tabla distritos_fiscales...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS distritos_fiscales (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                nombre VARCHAR(200) NOT NULL UNIQUE,
                codigo VARCHAR(20) NOT NULL UNIQUE,
                region VARCHAR(100),
                provincia VARCHAR(100),
                direccion VARCHAR(200),
                telefono VARCHAR(20),
                email VARCHAR(100),
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)

        # Crear índices
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS ix_distritos_fiscales_nombre
            ON distritos_fiscales (nombre)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS ix_distritos_fiscales_codigo
            ON distritos_fiscales (codigo)
        """)

        # 2. Agregar columna distrito_fiscal_id a users
        print("2. Agregando distrito_fiscal_id a users...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN distrito_fiscal_id INTEGER")
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_users_distrito_fiscal_id
                ON users (distrito_fiscal_id)
            """)
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("   - Columna distrito_fiscal_id ya existe en users")
            else:
                raise

        # 3. Agregar columna distrito_fiscal_id a sedes
        print("3. Agregando distrito_fiscal_id a sedes...")
        try:
            cursor.execute("ALTER TABLE sedes ADD COLUMN distrito_fiscal_id INTEGER")
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_sedes_distrito_fiscal_id
                ON sedes (distrito_fiscal_id)
            """)
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("   - Columna distrito_fiscal_id ya existe en sedes")
            else:
                raise

        # 4. Agregar columna distrito_fiscal_id a peritos
        print("4. Agregando distrito_fiscal_id a peritos...")
        try:
            cursor.execute("ALTER TABLE peritos ADD COLUMN distrito_fiscal_id INTEGER")
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_peritos_distrito_fiscal_id
                ON peritos (distrito_fiscal_id)
            """)
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print("   - Columna distrito_fiscal_id ya existe en peritos")
            else:
                raise

        # 5. Migrar tabla despachos_fiscales (eliminar columna distrito, agregar distrito_fiscal_id, quitar unique de nombre)
        print("5. Migrando tabla despachos_fiscales...")

        # Verificar si existe la columna distrito
        cursor.execute("PRAGMA table_info(despachos_fiscales)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]

        has_distrito = "distrito" in column_names
        has_distrito_fiscal_id = "distrito_fiscal_id" in column_names

        if has_distrito or not has_distrito_fiscal_id:
            print("   - Recreando tabla despachos_fiscales...")

            # Leer datos existentes
            cursor.execute("SELECT * FROM despachos_fiscales")
            existing_data = cursor.fetchall()

            # Crear tabla temporal con nueva estructura
            cursor.execute("""
                CREATE TABLE despachos_fiscales_new (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    nombre VARCHAR(200) NOT NULL,
                    direccion VARCHAR(200),
                    telefono VARCHAR(20),
                    fiscal_titular VARCHAR(100),
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP,
                    distrito_fiscal_id INTEGER
                )
            """)

            # Copiar datos (excluyendo la columna distrito si existe)
            if existing_data:
                # Mapear columnas antiguas a nuevas
                old_cols = {col[1]: idx for idx, col in enumerate(columns)}

                for row in existing_data:
                    cursor.execute("""
                        INSERT INTO despachos_fiscales_new
                        (id, nombre, direccion, telefono, fiscal_titular, is_active, created_at, updated_at, distrito_fiscal_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        row[old_cols['id']],
                        row[old_cols['nombre']],
                        row[old_cols.get('direccion', 2)],
                        row[old_cols.get('telefono', 3)],
                        row[old_cols.get('fiscal_titular', 4)],
                        row[old_cols.get('is_active', 5)],
                        row[old_cols.get('created_at', 6)],
                        row[old_cols.get('updated_at', 7)],
                        row[old_cols['distrito_fiscal_id']] if has_distrito_fiscal_id else None
                    ))

            # Eliminar tabla antigua y renombrar
            cursor.execute("DROP TABLE despachos_fiscales")
            cursor.execute("ALTER TABLE despachos_fiscales_new RENAME TO despachos_fiscales")

            # Crear índices
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_despachos_fiscales_nombre
                ON despachos_fiscales (nombre)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_despachos_fiscales_distrito_fiscal_id
                ON despachos_fiscales (distrito_fiscal_id)
            """)
        else:
            print("   - Tabla despachos_fiscales ya está actualizada")

        # 6. Recrear tabla sedes sin constraint UNIQUE en nombre
        print("6. Verificando tabla sedes...")
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='sedes'")
        sedes_schema = cursor.fetchone()

        if sedes_schema and 'UNIQUE' in sedes_schema[0] and 'nombre' in sedes_schema[0]:
            print("   - Recreando tabla sedes sin UNIQUE constraint en nombre...")

            # Leer datos existentes
            cursor.execute("SELECT * FROM sedes")
            existing_sedes = cursor.fetchall()

            cursor.execute("PRAGMA table_info(sedes)")
            sedes_columns = cursor.fetchall()

            # Crear tabla temporal
            cursor.execute("""
                CREATE TABLE sedes_new (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    nombre VARCHAR(100) NOT NULL,
                    direccion VARCHAR(200),
                    telefono VARCHAR(20),
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP,
                    distrito_fiscal_id INTEGER
                )
            """)

            # Copiar datos
            if existing_sedes:
                sedes_cols = {col[1]: idx for idx, col in enumerate(sedes_columns)}
                for row in existing_sedes:
                    cursor.execute("""
                        INSERT INTO sedes_new
                        (id, nombre, direccion, telefono, is_active, created_at, updated_at, distrito_fiscal_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        row[sedes_cols['id']],
                        row[sedes_cols['nombre']],
                        row[sedes_cols.get('direccion', 2)],
                        row[sedes_cols.get('telefono', 3)],
                        row[sedes_cols.get('is_active', 4)],
                        row[sedes_cols.get('created_at', 5)],
                        row[sedes_cols.get('updated_at', 6)],
                        row[sedes_cols.get('distrito_fiscal_id', len(row)-1)] if 'distrito_fiscal_id' in sedes_cols else None
                    ))

            # Eliminar tabla antigua y renombrar
            cursor.execute("DROP TABLE sedes")
            cursor.execute("ALTER TABLE sedes_new RENAME TO sedes")

            # Crear índices
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_sedes_nombre
                ON sedes (nombre)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_sedes_distrito_fiscal_id
                ON sedes (distrito_fiscal_id)
            """)
        else:
            print("   - Tabla sedes ya está actualizada")

        # Commit cambios
        conn.commit()
        print("\n✅ Migración completada exitosamente!")

        # Mostrar resumen
        print("\nResumen de cambios:")
        print("- Tabla 'distritos_fiscales' creada")
        print("- Columna 'distrito_fiscal_id' agregada a: users, sedes, peritos, despachos_fiscales")
        print("- Columna 'distrito' eliminada de despachos_fiscales (si existía)")
        print("- Constraint UNIQUE eliminado de 'nombre' en sedes y despachos_fiscales")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error durante la migración: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("="*70)
    print("MIGRACIÓN: Agregar soporte de Distrito Fiscal")
    print("="*70)
    print(f"\nBase de datos: {DB_PATH}")
    print()

    migrate()
