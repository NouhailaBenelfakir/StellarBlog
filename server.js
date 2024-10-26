import express from 'express';
import path from 'path';
import fileupload from 'express-fileupload';
import { fileURLToPath } from 'url';
import client from 'prom-client'; // Import prom-client

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initial_path = path.join(__dirname, "public");

const app = express();
app.use(express.static(initial_path));
app.use(fileupload());

// Collect default metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics(); // Collects system-level metrics like CPU, memory usage, etc.

// Create custom metrics
const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// Track the number of uploads
const fileUploadCounter = new client.Counter({
    name: 'file_uploads_total',
    help: 'Total number of file uploads',
});

// Middleware to track requests
app.use((req, res, next) => {
    res.on('finish', () => {
        httpRequestCounter.inc({ method: req.method, route: req.path, status_code: res.statusCode });
    });
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(initial_path, "home.html"));
});

app.get('/editor', (req, res) => {
    res.sendFile(path.join(initial_path, "editor.html"));
});

// Upload link
app.post('/upload', (req, res) => {
    let file = req.files.image;
    let date = new Date();
    // Image name
    let imagename = date.getDate() + date.getTime() + file.name;
    // Image upload path
    let imagePath = path.join('public', 'uploads', imagename);

    // Create upload
    file.mv(imagePath, (err) => {
        if (err) {
            throw err;
        } else {
            // Increment the file upload counter
            fileUploadCounter.inc();
            // Return image path
            res.json(`uploads/${imagename}`);
        }
    });
});

// Expose Prometheus metrics on /metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

app.get("/:blog", (req, res) => {
    res.sendFile(path.join(initial_path, "blog.html"));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json("404");
});

app.listen("4000", () => {
    console.log('listening on port 4000...');
});
