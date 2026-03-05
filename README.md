# My CV

Simple Express app to view and download your CV as PDF. Built with TypeScript and tsx.

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Routes

- **`/`** — View CV in browser
- **`/download`** — Download CV as PDF

## Edit CV

Edit `data/cv.json` to update your CV content. The EJS template at `views/cv.ejs` renders it.
