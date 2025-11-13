"""
Script para poblar la base de datos con los 34 Distritos Fiscales de Perú
Basado en la estructura oficial del Ministerio Público del Perú
"""
import sqlite3
from pathlib import Path
from datetime import datetime

# Ubicación de la base de datos
DB_PATH = Path(__file__).parent / "sigeca.db"

# Lista completa de los 34 Distritos Fiscales del Perú
DISTRITOS_FISCALES = [
    # Amazonas
    {"codigo": "DF-AMAZ", "nombre": "Amazonas", "region": "Amazonas", "provincia": "Chachapoyas"},

    # Ancash
    {"codigo": "DF-ANCS", "nombre": "Ancash", "region": "Ancash", "provincia": "Huaraz"},

    # Apurímac
    {"codigo": "DF-APUR", "nombre": "Apurímac", "region": "Apurímac", "provincia": "Abancay"},

    # Arequipa
    {"codigo": "DF-AREQ", "nombre": "Arequipa", "region": "Arequipa", "provincia": "Arequipa"},

    # Ayacucho
    {"codigo": "DF-AYAC", "nombre": "Ayacucho", "region": "Ayacucho", "provincia": "Huamanga"},

    # Cajamarca
    {"codigo": "DF-CAJA", "nombre": "Cajamarca", "region": "Cajamarca", "provincia": "Cajamarca"},

    # Callao (Provincia Constitucional)
    {"codigo": "DF-CALL", "nombre": "Callao", "region": "Callao", "provincia": "Callao"},

    # Cañete
    {"codigo": "DF-CAÑE", "nombre": "Cañete", "region": "Lima", "provincia": "Cañete"},

    # Cusco
    {"codigo": "DF-CUSC", "nombre": "Cusco", "region": "Cusco", "provincia": "Cusco"},

    # Huancavelica
    {"codigo": "DF-HVEL", "nombre": "Huancavelica", "region": "Huancavelica", "provincia": "Huancavelica"},

    # Huánuco
    {"codigo": "DF-HUCO", "nombre": "Huánuco", "region": "Huánuco", "provincia": "Huánuco"},

    # Huaura
    {"codigo": "DF-HUAR", "nombre": "Huaura", "region": "Lima", "provincia": "Huaura"},

    # Ica
    {"codigo": "DF-ICA", "nombre": "Ica", "region": "Ica", "provincia": "Ica"},

    # Junín
    {"codigo": "DF-JUNI", "nombre": "Junín", "region": "Junín", "provincia": "Huancayo"},

    # La Libertad
    {"codigo": "DF-LALI", "nombre": "La Libertad", "region": "La Libertad", "provincia": "Trujillo"},

    # Lambayeque
    {"codigo": "DF-LAMB", "nombre": "Lambayeque", "region": "Lambayeque", "provincia": "Chiclayo"},

    # Lima (Centro)
    {"codigo": "DF-LIMA", "nombre": "Lima", "region": "Lima", "provincia": "Lima"},

    # Lima Este
    {"codigo": "DF-LEST", "nombre": "Lima Este", "region": "Lima", "provincia": "Lima Este"},

    # Lima Noroeste
    {"codigo": "DF-LNOR", "nombre": "Lima Noroeste", "region": "Lima", "provincia": "Lima Noroeste"},

    # Lima Norte
    {"codigo": "DF-LNTE", "nombre": "Lima Norte", "region": "Lima", "provincia": "Lima Norte"},

    # Lima Sur
    {"codigo": "DF-LSUR", "nombre": "Lima Sur", "region": "Lima", "provincia": "Lima Sur"},

    # Loreto
    {"codigo": "DF-LORE", "nombre": "Loreto", "region": "Loreto", "provincia": "Maynas"},

    # Madre de Dios
    {"codigo": "DF-MADR", "nombre": "Madre de Dios", "region": "Madre de Dios", "provincia": "Tambopata"},

    # Moquegua
    {"codigo": "DF-MOQU", "nombre": "Moquegua", "region": "Moquegua", "provincia": "Mariscal Nieto"},

    # Pasco
    {"codigo": "DF-PASC", "nombre": "Pasco", "region": "Pasco", "provincia": "Pasco"},

    # Piura
    {"codigo": "DF-PIUR", "nombre": "Piura", "region": "Piura", "provincia": "Piura"},

    # Puno
    {"codigo": "DF-PUNO", "nombre": "Puno", "region": "Puno", "provincia": "Puno"},

    # San Martín
    {"codigo": "DF-SMAR", "nombre": "San Martín", "region": "San Martín", "provincia": "Moyobamba"},

    # Santa (Chimbote)
    {"codigo": "DF-SANT", "nombre": "Santa", "region": "Ancash", "provincia": "Santa"},

    # Selva Central
    {"codigo": "DF-SCEL", "nombre": "Selva Central", "region": "Junín", "provincia": "Chanchamayo"},

    # Sullana
    {"codigo": "DF-SULL", "nombre": "Sullana", "region": "Piura", "provincia": "Sullana"},

    # Tacna
    {"codigo": "DF-TACN", "nombre": "Tacna", "region": "Tacna", "provincia": "Tacna"},

    # Tumbes
    {"codigo": "DF-TUMB", "nombre": "Tumbes", "region": "Tumbes", "provincia": "Tumbes"},

    # Ucayali
    {"codigo": "DF-UCAY", "nombre": "Ucayali", "region": "Ucayali", "provincia": "Coronel Portillo"},
]


def seed_distritos_fiscales():
    """Poblar la tabla distritos_fiscales con los 34 distritos oficiales"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("=" * 70)
        print("SEED DATA: Distritos Fiscales de Perú")
        print("=" * 70)
        print(f"\nBase de datos: {DB_PATH}")
        print(f"Total de distritos a insertar: {len(DISTRITOS_FISCALES)}\n")

        # Verificar si ya existen distritos
        cursor.execute("SELECT COUNT(*) FROM distritos_fiscales")
        count = cursor.fetchone()[0]

        if count > 0:
            print(f"[!] La tabla ya contiene {count} distrito(s).")
            response = input("Desea eliminar los existentes y volver a poblar? (s/n): ")
            if response.lower() == 's':
                cursor.execute("DELETE FROM distritos_fiscales")
                print("[OK] Distritos existentes eliminados.")
            else:
                print("[X] Operacion cancelada.")
                return

        # Insertar los 34 distritos fiscales
        inserted_count = 0
        for df in DISTRITOS_FISCALES:
            try:
                cursor.execute("""
                    INSERT INTO distritos_fiscales
                    (codigo, nombre, region, provincia, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    df["codigo"],
                    df["nombre"],
                    df["region"],
                    df["provincia"],
                    1,  # is_active
                    datetime.utcnow().isoformat()
                ))
                inserted_count += 1
                print(f"[OK] {df['codigo']:12} - {df['nombre']:20} ({df['region']})")
            except sqlite3.IntegrityError as e:
                print(f"[!]  {df['codigo']:12} - {df['nombre']:20} ya existe (SKIP)")

        # Commit cambios
        conn.commit()
        print("\n" + "=" * 70)
        print(f"[OK] Seed completado exitosamente!")
        print(f"     Distritos insertados: {inserted_count}/{len(DISTRITOS_FISCALES)}")
        print("=" * 70)

        # Mostrar resumen
        cursor.execute("SELECT COUNT(*) FROM distritos_fiscales")
        total = cursor.fetchone()[0]
        print(f"\n[INFO] Total de distritos fiscales en la BD: {total}")

        # Mostrar algunos ejemplos
        print("\n[INFO] Ejemplos de distritos registrados:")
        cursor.execute("""
            SELECT codigo, nombre, region, provincia
            FROM distritos_fiscales
            ORDER BY nombre
            LIMIT 10
        """)
        for row in cursor.fetchall():
            print(f"       {row[0]:12} - {row[1]:20} | {row[2]:15} / {row[3]}")

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] Error durante el seed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    seed_distritos_fiscales()
