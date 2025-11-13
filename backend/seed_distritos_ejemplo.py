"""
Script para limpiar y crear datos de ejemplo: 2 Distritos Fiscales
"""
import sqlite3
from pathlib import Path
from datetime import datetime

# Ubicación de la base de datos
DB_PATH = Path(__file__).parent / "sigeca.db"

# 2 Distritos Fiscales de ejemplo
DISTRITOS_EJEMPLO = [
    {
        "codigo": "DF-LIMA",
        "nombre": "Lima",
        "region": "Lima",
        "provincia": "Lima",
        "direccion": "Av. Abancay cuadra 5 s/n - Cercado de Lima",
        "telefono": "01-208-5555",
        "email": "fiscalia.lima@mpfn.gob.pe"
    },
    {
        "codigo": "DF-AREQ",
        "nombre": "Arequipa",
        "region": "Arequipa",
        "provincia": "Arequipa",
        "direccion": "Calle Peral 307 - Arequipa",
        "telefono": "054-381-760",
        "email": "fiscalia.arequipa@mpfn.gob.pe"
    },
]


def clean_and_seed():
    """Limpiar base de datos y crear datos de ejemplo"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("=" * 70)
        print("LIMPIEZA Y DATOS DE EJEMPLO")
        print("=" * 70)
        print(f"\nBase de datos: {DB_PATH}\n")

        # 1. Limpiar distritos fiscales existentes
        print("1. Limpiando distritos fiscales existentes...")
        cursor.execute("DELETE FROM distritos_fiscales")
        print("[OK] Distritos fiscales eliminados")

        # 2. Limpiar datos relacionados (distrito_fiscal_id = NULL)
        print("\n2. Limpiando referencias en tablas relacionadas...")
        cursor.execute("UPDATE users SET distrito_fiscal_id = NULL")
        cursor.execute("UPDATE sedes SET distrito_fiscal_id = NULL")
        cursor.execute("UPDATE peritos SET distrito_fiscal_id = NULL")
        cursor.execute("UPDATE despachos_fiscales SET distrito_fiscal_id = NULL")
        print("[OK] Referencias limpiadas")

        # 3. Insertar 2 distritos de ejemplo
        print("\n3. Creando 2 distritos fiscales de ejemplo...")
        for df in DISTRITOS_EJEMPLO:
            cursor.execute("""
                INSERT INTO distritos_fiscales
                (codigo, nombre, region, provincia, direccion, telefono, email, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                df["codigo"],
                df["nombre"],
                df["region"],
                df["provincia"],
                df["direccion"],
                df["telefono"],
                df["email"],
                1,  # is_active
                datetime.utcnow().isoformat()
            ))
            print(f"[OK] {df['codigo']:12} - {df['nombre']}")

        # 4. Obtener los IDs de los distritos creados
        cursor.execute("SELECT id, codigo, nombre FROM distritos_fiscales ORDER BY id")
        distritos = cursor.fetchall()
        lima_id = distritos[0][0]
        arequipa_id = distritos[1][0]

        # 5. Asignar el usuario admin a Lima (si existe)
        print("\n4. Asignando usuario admin a distrito Lima...")
        cursor.execute("SELECT id FROM users WHERE username = 'admin' LIMIT 1")
        admin = cursor.fetchone()
        if admin:
            cursor.execute("UPDATE users SET distrito_fiscal_id = ? WHERE id = ?", (lima_id, admin[0]))
            print("[OK] Usuario admin asignado a Lima")
        else:
            print("[!] Usuario admin no encontrado")

        # 6. Crear ejemplos de Sedes (una por distrito)
        print("\n5. Creando sedes de ejemplo...")
        cursor.execute("""
            INSERT INTO sedes (nombre, direccion, telefono, is_active, distrito_fiscal_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "Sede Camaras Gesell Lima",
            "Av. Abancay cdra 5 - Lima",
            "01-208-5555",
            1,
            lima_id,
            datetime.utcnow().isoformat()
        ))
        print("[OK] Sede Lima creada")

        cursor.execute("""
            INSERT INTO sedes (nombre, direccion, telefono, is_active, distrito_fiscal_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "Sede Camaras Gesell Arequipa",
            "Calle Peral 307 - Arequipa",
            "054-381-760",
            1,
            arequipa_id,
            datetime.utcnow().isoformat()
        ))
        print("[OK] Sede Arequipa creada")

        # 7. Crear ejemplos de Despachos Fiscales
        print("\n6. Creando despachos fiscales de ejemplo...")
        cursor.execute("""
            INSERT INTO despachos_fiscales (nombre, fiscal_titular, direccion, is_active, distrito_fiscal_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "1ra Fiscalia Provincial Penal de Lima",
            "Dr. Juan Perez Garcia",
            "Av. Abancay cdra 5 - Lima",
            1,
            lima_id,
            datetime.utcnow().isoformat()
        ))
        print("[OK] Despacho Fiscal Lima creado")

        cursor.execute("""
            INSERT INTO despachos_fiscales (nombre, fiscal_titular, direccion, is_active, distrito_fiscal_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "1ra Fiscalia Provincial Penal de Arequipa",
            "Dra. Maria Rodriguez Lopez",
            "Calle Peral 307 - Arequipa",
            1,
            arequipa_id,
            datetime.utcnow().isoformat()
        ))
        print("[OK] Despacho Fiscal Arequipa creado")

        # Commit cambios
        conn.commit()
        print("\n" + "=" * 70)
        print("[OK] Limpieza y seed completado exitosamente!")
        print("=" * 70)

        # Mostrar resumen
        print("\n[INFO] Resumen:")
        cursor.execute("SELECT id, codigo, nombre FROM distritos_fiscales")
        for row in cursor.fetchall():
            print(f"       ID {row[0]} - {row[1]:12} - {row[2]}")

        cursor.execute("SELECT COUNT(*) FROM sedes WHERE distrito_fiscal_id IS NOT NULL")
        print(f"\n[INFO] Sedes creadas: {cursor.fetchone()[0]}")

        cursor.execute("SELECT COUNT(*) FROM despachos_fiscales WHERE distrito_fiscal_id IS NOT NULL")
        print(f"[INFO] Despachos creados: {cursor.fetchone()[0]}")

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] Error durante el proceso: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    clean_and_seed()
