#!/bin/bash
# Azure App Service startup script
# Azure App Service sets PORT environment variable
gunicorn --bind 0.0.0.0:$PORT --timeout 600 --workers 2 --threads 4 --access-logfile '-' --error-logfile '-' app:app
