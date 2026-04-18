import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import cors from "cors";
import fs from "fs";
import * as XLSX from "xlsx";

// CSV Log initialization
const LOG_FILE = "activity_log.csv";
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, "Timestamp,Operation,ItemID,Title,Details\n");
}

function getISTDate(date: Date) {
  // IST is UTC + 5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffset);
}

function formatIST(isoString: string) {
  const date = new Date(isoString);
  const istDate = getISTDate(date);
  
  const d = istDate.toISOString().split('T')[0];
  const t = istDate.toISOString().split('T')[1].split('.')[0];
  
  return { date: d, time: t };
}

function logToCSV(operation: string, id: string | number, title: string, details: string) {
  const timestamp = new Date().toISOString();
  // Simple CSV escape for strings containing commas
  const escapedTitle = `"${title.replace(/"/g, '""')}"`;
  const escapedDetails = `"${details.replace(/"/g, '""')}"`;
  const logEntry = `${timestamp},${operation},${id},${escapedTitle},${escapedDetails}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);
}

// Initialize Database
const db = new Database("list_manager.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/logs", (req, res) => {
    try {
      if (fs.existsSync(LOG_FILE)) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=activity_log.csv');
        fs.createReadStream(LOG_FILE).pipe(res);
      } else {
        res.status(404).json({ error: "Log file not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.get("/api/logs/json", (req, res) => {
    try {
      if (fs.existsSync(LOG_FILE)) {
        const content = fs.readFileSync(LOG_FILE, 'utf-8');
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(line => {
          // Robust CSV parsing for simple quoted strings
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches) return null;
          return {
            timestamp: matches[0],
            operation: matches[1],
            id: matches[2],
            title: matches[3]?.replace(/^"|"$/g, ''),
            details: matches[4]?.replace(/^"|"$/g, '')
          };
        }).filter(Boolean);
        res.json(data);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch JSON logs" });
    }
  });

  app.get("/api/logs/xls", (req, res) => {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        return res.status(404).json({ error: "Log file not found" });
      }

      const content = fs.readFileSync(LOG_FILE, 'utf-8');
      const lines = content.trim().split('\n');
      
      const formattedData = lines.map((line, index) => {
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const cleanParts = parts?.map(p => p.replace(/^"|"$/g, '')) || [];
        
        if (index === 0) {
          return ["Date", "Time (IST)", "Operation", "ItemID", "Title", "Details"];
        }
        
        const { date, time } = formatIST(cleanParts[0]);
        return [date, time, cleanParts[1], cleanParts[2], cleanParts[3], cleanParts[4]];
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(formattedData);
      
      // Auto-size columns
      const colWidths = [12, 12, 12, 10, 20, 40];
      ws['!cols'] = colWidths.map(w => ({ wch: w }));

      XLSX.utils.book_append_sheet(wb, ws, "Activity Log IST");
      
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xls" });
      
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_log_ist.xls');
      res.send(buf);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate XLS" });
    }
  });

  app.get("/api/logs/txt", (req, res) => {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        return res.status(404).json({ error: "Log file not found" });
      }

      const content = fs.readFileSync(LOG_FILE, 'utf-8');
      const lines = content.trim().split('\n');
      
      let txtContent = "SYSTEM AUDIT LOG - LIST MANAGER SYSTEM (IST TIMEZONE)\n";
      txtContent += "==================================================================================================\n";
      txtContent += `| ${"DATE".padEnd(10)} | ${"TIME (IST)".padEnd(10)} | ${"OP".padEnd(8)} | ${"ID".padEnd(4)} | ${"TITLE".padEnd(20)} | ${"DETAILS".padEnd(30)} |\n`;
      txtContent += "--------------------------------------------------------------------------------------------------\n";

      lines.slice(1).forEach(line => {
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (matches) {
          const [ts, op, id, title, details] = matches.map(m => m.replace(/^"|"$/g, ''));
          const { date, time } = formatIST(ts);
          
          txtContent += `| ${date.padEnd(10)} | ${time.padEnd(10)} | ${op.padEnd(8)} | ${id.padEnd(4)} | ${title.substring(0, 20).padEnd(20)} | ${details.substring(0, 30).padEnd(30)} |\n`;
        }
      });
      txtContent += "==================================================================================================\n";

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_log_ist.txt');
      res.send(txtContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate TXT" });
    }
  });

  // API Routes
  app.get("/api/items", (req, res) => {
    try {
      const items = db.prepare("SELECT * FROM items ORDER BY created_at DESC").all();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.post("/api/items", (req, res) => {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    try {
      const info = db.prepare("INSERT INTO items (title, description) VALUES (?, ?)").run(title, description);
      const newItem = db.prepare("SELECT * FROM items WHERE id = ?").get(info.lastInsertRowid) as any;
      logToCSV("CREATE", newItem.id, newItem.title, `Initial creation: ${description || 'No description'}`);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to add item" });
    }
  });

  app.put("/api/items/:id", (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    try {
      const result = db.prepare("UPDATE items SET title = ?, description = ? WHERE id = ?").run(title, description, id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      const updatedItem = db.prepare("SELECT * FROM items WHERE id = ?").get(id) as any;
      logToCSV("UPDATE", id, updatedItem.title, `Changed to: ${title} | ${description}`);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", (req, res) => {
    const { id } = req.params;
    try {
      const itemToDelete = db.prepare("SELECT title FROM items WHERE id = ?").get(id) as any;
      const result = db.prepare("DELETE FROM items WHERE id = ?").run(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      if (itemToDelete) {
        logToCSV("DELETE", id, itemToDelete.title, "Item permanently removed from database");
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
