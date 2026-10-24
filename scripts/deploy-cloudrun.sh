#!/usr/bin/env bash
set -e

# ==============================================================================
# Inkloom AI - Google Cloud Run Serverless Deployment Script
# ==============================================================================
# Prerequisites:
# 1. Install Google Cloud SDK (gcloud)
# 2. Authenticate: gcloud auth login
# 3. Set Project: gcloud config set project YOUR_PROJECT_ID
# ==============================================================================

REGION="${GCP_REGION:-us-central1}"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "Error: No active GCP project configured. Run 'gcloud config set project <PROJECT_ID>'."
    exit 1
fi

echo "=========================================================="
echo " Deploying Inkloom AI to Google Cloud Run"
echo " Project: $PROJECT_ID"
echo " Region:  $REGION"
echo "=========================================================="

echo "Step 1: Deploying Backend Service (FastAPI)..."
gcloud run deploy inkloom-backend \
    --source . \
    --region "$REGION" \
    --allow-unauthenticated \
    --port 8000 \
    --set-env-vars "ENVIRONMENT=production,AI_ENGINE_MODE=deterministic" \
    --quiet

BACKEND_URL=$(gcloud run services describe inkloom-backend --platform managed --region "$REGION" --format 'value(status.url)')
echo "✓ Backend deployed successfully at: $BACKEND_URL"

echo "Step 2: Deploying Frontend Service (Next.js)..."
gcloud run deploy inkloom-frontend \
    --source ./frontend \
    --region "$REGION" \
    --allow-unauthenticated \
    --port 3000 \
    --set-env-vars "NEXT_PUBLIC_API_URL=${BACKEND_URL}/api/v1,NEXT_PUBLIC_USE_MOCK=false" \
    --quiet

FRONTEND_URL=$(gcloud run services describe inkloom-frontend --platform managed --region "$REGION" --format 'value(status.url)')
echo "✓ Frontend deployed successfully at: $FRONTEND_URL"

echo ""
echo "=========================================================="
echo " Cloud Run Deployment Complete!"
echo " Live URLs:"
echo " - Web Application: $FRONTEND_URL"
echo " - Backend API:     $BACKEND_URL"
echo " - API Docs:        $BACKEND_URL/docs"
echo "=========================================================="
