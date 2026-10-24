# Inkloom AI - Production Deployment Guide

This guide covers deployment instructions for **Inkloom AI** using Docker containers, Cloud Run, VPS (EC2/Droplets), and multi-container orchestration.

---

## 1. Quick Start with Docker Compose (Recommended for Local & VPS)

Inkloom AI includes a production multi-container setup with:
- **FastAPI Backend:** Deterministic AI Governance Engine on port `8000`.
- **Next.js Frontend:** Multi-stage standalone build on port `3000`.
- **PostgreSQL 15:** Relational multi-tenant database on port `5432`.

### On Linux / macOS / Cloud VPS:
```bash
# Clone the repository
git clone https://github.com/NEHABAGAL07/inkloom_ai.git
cd inkloom_ai

# Run one-click deployment script
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh
```

### On Windows (PowerShell):
```powershell
# Open PowerShell in the project directory
.\scripts\deploy-docker.ps1
```

Or run directly with `docker compose`:
```bash
docker compose up --build -d
```

### Verify Deployment:
- **Web Interface:** [http://localhost:3000](http://localhost:3000)
- **API Health:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- **Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 2. Deploy to Google Cloud Run (Serverless Containers)

Google Cloud Run allows serverless hosting with zero server maintenance and auto-scaling.

### Prerequisites:
1. Install [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install).
2. Authenticate:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```

### Deploying with One-Click Script:
```bash
chmod +x scripts/deploy-cloudrun.sh
./scripts/deploy-cloudrun.sh
```

### Manual Cloud Run Commands:
```bash
# 1. Deploy Backend API
gcloud run deploy inkloom-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --set-env-vars "ENVIRONMENT=production,AI_ENGINE_MODE=deterministic"

# Copy the generated backend URL (e.g. https://inkloom-backend-xyz.run.app)

# 2. Deploy Frontend Application
gcloud run deploy inkloom-frontend \
  --source ./frontend \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://inkloom-backend-xyz.run.app/api/v1,NEXT_PUBLIC_USE_MOCK=false"
```

---

## 3. Deploying to Cloud VPS (AWS EC2 / DigitalOcean / Linode / Hetzner)

### Step 1: Provision an Ubuntu 22.04 / 24.04 Server
Connect via SSH:
```bash
ssh root@YOUR_SERVER_IP
```

### Step 2: Install Docker & Docker Compose
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Step 3: Clone & Launch Inkloom AI
```bash
git clone https://github.com/NEHABAGAL07/inkloom_ai.git /opt/inkloom_ai
cd /opt/inkloom_ai

# Start containers in background
docker compose up --build -d
```

### Step 4: Setup Nginx Reverse Proxy with Free SSL (Let's Encrypt)
Install Nginx and Certbot:
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Configure `/etc/nginx/sites-available/inkloom`:
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site and activate SSL:
```bash
sudo ln -s /etc/nginx/sites-available/inkloom /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 4. Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL or SQLite database URI | `sqlite:///backend/inkloom_dev.db` |
| `ENVIRONMENT` | Runtime mode (`development`, `production`) | `production` |
| `AI_ENGINE_MODE` | Evaluation pipeline (`deterministic`) | `deterministic` |
| `CORS_ORIGINS` | Permitted cross-origin hosts | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Target FastAPI API base URL for frontend | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_USE_MOCK` | Fallback mock client if backend unreachable | `false` |

---

## 5. Automated CI/CD (GitHub Actions)

When you push to the `main` branch, `.github/workflows/deploy.yml` automatically builds and publishes container images to GitHub Container Registry (`ghcr.io`):
- `ghcr.io/nehabagal07/inkloom_ai/backend:latest`
- `ghcr.io/nehabagal07/inkloom_ai/frontend:latest`

You can pull and run the prebuilt images directly without building on your server:
```bash
docker pull ghcr.io/nehabagal07/inkloom_ai/backend:latest
docker pull ghcr.io/nehabagal07/inkloom_ai/frontend:latest
```
