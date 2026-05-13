#  MoA Conference Portal (Ministry of Agriculture)

An enterprise-grade, full-stack facility reservation system built specifically for the Ministry of Agriculture. This portal streamlines the booking of conference halls, manages technical and catering services, and prevents scheduling conflicts using smart calendar logic.

##  Key Features

* **Smart Conflict Detection:** Automatically prevents double-booking. Detects "Hard Overlaps" (Confirmed bookings), "Soft Overlaps" (Pending bookings), and enforces mandatory 1-hour cleaning gaps between events.
* **Ethiopian Calendar Integration:** Fully integrated with the Ethiopian calendar for localized date picking, scheduling, and official documentation.
* **Role-Based Access Control (RBAC):** Distinct dashboards for Event Organizers, System Admins, VIPs, and Catering/ICT staff.
* **24-Hour Vault Lock:** Automatically freezes modifications and cancellations 24 hours before an event start time to prevent logistical chaos.
* **Smart Service Engine:** Dynamically calculates pricing based on venue rates and requested add-ons. Automatically identifies and locks services that are already natively included with specific halls.
* **Live Tracking System:** Organizers can track their request status (Pending, Awaiting Payment, Confirmed, VIP Override, Rejected) using a unique `MOA-BKG-XX` Reference ID.
* **Automated Email Engine:** Dispatches real-time status updates and PDF contract attachments via SMTP.

##  Tech Stack

**Frontend:**
* React (TypeScript)
* Tailwind CSS (Styling)
* Lucide React (Icons)
* Ethiopian Calendar Date Converter

**Backend:**
* Django & Django REST Framework (DRF)
* PostgreSQL DB
* Python Decouple (Environment management)

##  Getting Started

### Prerequisites
* Node.js (v18+)
* Python (3.10+)

### 1. Backend Setup (Django)
Navigate to the backend directory:
\`\`\`bash
cd backend
python -m venv venv
source venv/Scripts/activate  # On Mac/Linux use: source venv/bin/activate
pip install -r requirements.txt
\`\`\`

Create a `.env` file in the backend root based on `.env.example`:
\`\`\`env
DEBUG=True
SECRET_KEY=your-secret-key-here
CORS_ALLOW_ALL_ORIGINS=True

# Email Configuration (Use Console for local dev without Wi-Fi issues)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=amantarekegn123@gmail.com
EMAIL_HOST_PASSWORD=njwalntzeeadfjxw
\`\`\`

Run migrations and start the server:
\`\`\`bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
\`\`\`

### 2. Frontend Setup (React)
Navigate to the frontend directory:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
The application will be running at `http://localhost:5173` (or your configured Vite port).

##  Business Rules
* **Modifications:** Organizers can edit pax, phone numbers, and descriptions until 24 hours prior. Date/Venue changes require full cancellation to prevent calendar desync.
* **Overrides:** System Administrators possess the ability to invoke a "VIP Override" which bypasses payment constraints and automatically resolves conflicts by retracting overlapping pending requests.

---
*Developed for the Ministry of Agriculture, Ethiopia.*