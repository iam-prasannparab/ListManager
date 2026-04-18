from flask import Blueprint, request, jsonify, send_file
from models.item import Item
import csv
import os
import pandas as pd
from datetime import datetime
import io

item_bp = Blueprint('items', __name__)

LOG_FILE = 'activity_log.csv'

def log_to_csv(operation, item_id, title, details):
    file_exists = os.path.isfile(LOG_FILE)
    with open(LOG_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(['Timestamp', 'Operation', 'ItemID', 'Title', 'Details'])
        writer.writerow([datetime.now().isoformat(), operation, item_id, title, details])

@item_bp.route('/api/logs', methods=['GET'])
def get_logs():
    if os.path.exists(LOG_FILE):
        return send_file(LOG_FILE, as_attachment=True)
    return jsonify({"error": "Log file not found"}), 404

@item_bp.route('/api/logs/json', methods=['GET'])
def get_logs_json():
    if not os.path.exists(LOG_FILE):
        return jsonify([]), 200
    
    logs = []
    try:
        with open(LOG_FILE, mode='r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                logs.append(row)
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@item_bp.route('/api/logs/xls', methods=['GET'])
def get_logs_xls():
    if not os.path.exists(LOG_FILE):
        return jsonify({"error": "Log file not found"}), 404
    
    try:
        df = pd.read_csv(LOG_FILE)
        output = io.BytesIO()
        # Use xlwt for .xls format
        with pd.ExcelWriter(output, engine='xlwt') as writer:
            df.to_excel(writer, index=False, sheet_name='Activity Log')
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.ms-excel',
            as_attachment=True,
            download_name='activity_log.xls'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@item_bp.route('/api/logs/txt', methods=['GET'])
def get_logs_txt():
    if not os.path.exists(LOG_FILE):
        return jsonify({"error": "Log file not found"}), 404
    
    try:
        df = pd.read_csv(LOG_FILE)
        txt_output = "SYSTEM AUDIT LOG - LIST MANAGER PRO\n"
        txt_output += "====================================\n\n"
        
        for index, row in df.iterrows():
            txt_output += f"[{row['Timestamp']}] {str(row['Operation']).ljust(8)} | ID: {str(row['ItemID']).ljust(4)} | TITLE: {row['Title']}\n"
            txt_output += f"DETAILS: {row['Details']}\n"
            txt_output += "------------------------------------\n"
            
        return send_file(
            io.BytesIO(txt_output.encode('utf-8')),
            mimetype='text/plain',
            as_attachment=True,
            download_name='activity_log.txt'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@item_bp.route('/api/items', methods=['GET'])
def get_items():
    try:
        items = Item.get_all()
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@item_bp.route('/api/items', methods=['POST'])
def create_item():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')

    if not title:
        return jsonify({"error": "Title is required"}), 400

    try:
        item_id = Item.create(title, description)
        new_item = Item.get_by_id(item_id)
        log_to_csv('CREATE', item_id, title, f"Initial creation: {description or 'No description'}")
        return jsonify(new_item), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@item_bp.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')

    if not title:
        return jsonify({"error": "Title is required"}), 400

    try:
        success = Item.update(item_id, title, description)
        if not success:
            return jsonify({"error": "Item not found"}), 404
        
        updated_item = Item.get_by_id(item_id)
        log_to_csv('UPDATE', item_id, updated_item['title'], f"Changed to: {title} | {description}")
        return jsonify(updated_item), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@item_bp.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        item_to_delete = Item.get_by_id(item_id)
        success = Item.delete(item_id)
        if not success:
            return jsonify({"error": "Item not found"}), 404
        if item_to_delete:
            log_to_csv('DELETE', item_id, item_to_delete['title'], "Item permanently removed from database")
        return '', 204
    except Exception as e:
        return jsonify({"error": str(e)}), 500
