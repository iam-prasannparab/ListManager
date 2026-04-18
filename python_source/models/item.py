import mysql.connector
from config import Config

def get_db_connection():
    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB
    )

class Item:
    @staticmethod
    def get_all():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM items ORDER BY created_at DESC")
        items = cursor.fetchall()
        cursor.close()
        conn.close()
        return items

    @staticmethod
    def create(title, description):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO items (title, description) VALUES (%s, %s)",
            (title, description)
        )
        conn.commit()
        item_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return item_id

    @staticmethod
    def update(item_id, title, description):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE items SET title = %s, description = %s WHERE id = %s",
            (title, description, item_id)
        )
        conn.commit()
        rows_affected = cursor.rowcount
        cursor.close()
        conn.close()
        return rows_affected > 0

    @staticmethod
    def delete(item_id):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM items WHERE id = %s", (item_id,))
        conn.commit()
        rows_affected = cursor.rowcount
        cursor.close()
        conn.close()
        return rows_affected > 0

    @staticmethod
    def get_by_id(item_id):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM items WHERE id = %s", (item_id,))
        item = cursor.fetchone()
        cursor.close()
        conn.close()
        return item
