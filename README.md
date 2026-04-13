# Babyfoot Workspace

This repository contains two apps:

- backend: Express and TypeScript API
- frontend: Vue and Vite web app

This root workspace lets you install and run both from one place with npm workspaces and no extra dependencies.
Root commands directly delegate to the existing scripts in backend/package.json and frontend/package.json.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL running locally

## Step by step setup

### Update values of .env

- backend/.env
- frontend/.env

### Install dependencies

From the repository root:

```bash
npm install
```

### Initialize database

Use the backend migration helpers from the root:

```bash
npm run db:reboot
```

### Start both apps

From the repository root:

```bash
npm run dev
```

## Build both apps

From the repository root:

```bash
npm run build
```

## Daily command reference

- Start both apps: npm run dev
- Start backend only: npm run dev:backend
- Start frontend only: npm run dev:frontend
- Build both: npm run build
- Reset and seed DB: npm run db:reboot