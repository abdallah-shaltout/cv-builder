import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import puppeteer from "puppeteer";
import ejs from "ejs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cvData = JSON.parse(
    readFileSync(path.join(__dirname, "data", "cv.json"), "utf-8"),
);

const fontBase64 = readFileSync(
    path.join(__dirname, "assets", "font.woff2"),
).toString("base64");

const renderData = { ...cvData, fontBase64 };

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Main route - view CV
app.get("/", (_req, res) => {
    res.render("cv", renderData);
});

// Download route - convert HTML to PDF and download
app.get("/download", async (_req, res) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const html: string = await ejs.renderFile(
            path.join(__dirname, "views", "cv.ejs"),
            renderData,
        );

        const page = await browser.newPage();
        await page.setContent(
            // "<html><head><title>Test PDF</title></head><body><h1>Hello, this is a test PDF!</h1><p>This is some test HTML content generated for PDF export.</p></body></html>",
            html,
            {
                waitUntil: "load",
                timeout: 10000,
            },
        );
        await page.emulateMediaType("print");

        const pdfPath = path.join(tmpdir(), `cv-${Date.now()}.pdf`);

        await page.pdf({
            path: pdfPath,
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        });

        await browser.close();

        const pdfBuffer = await readFile(pdfPath);
        await unlink(pdfPath);

        const filename = "Abdallah-Shaltout-CV.pdf";
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`,
        );
        res.setHeader("Content-Length", pdfBuffer.length);
        res.end(pdfBuffer);
    } catch (err) {
        if (browser) await browser.close();
        console.error(err);
        res.status(500).send("Failed to generate PDF");
    }
});

app.listen(PORT, () => {
    console.log(`CV server running at http://localhost:${PORT}`);
    console.log(`  View:  http://localhost:${PORT}/`);
    console.log(`  Download PDF: http://localhost:${PORT}/download`);
});
