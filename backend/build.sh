#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect Static Files (for the Admin panel CSS)
python manage.py collectstatic --no-input

# Run Migrations (updates your Render database)
python manage.py migrate