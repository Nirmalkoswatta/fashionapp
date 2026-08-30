# Fashion Girl Setup Guide: A to Z Step-by-Step Instructions

This guide provides complete, step-by-step instructions to set up and run the **Fashion Girl Monorepo** project on a new computer.

The project consists of three services:

1. **Frontend**: React + Vite (running on port `5173`)
2. **Backend**: Node.js + Express (running on port `5000`)
3. **AI Service**: Python + FastAPI (running on port `8000`)

---

## 📋 Prerequisites & System Requirements

Before setting up the project, make sure the new computer has the following tools installed:

### 1. Git (Required)

- **Why**: The Python AI service installs the OpenAI CLIP model directly from GitHub using Git (`git+https://github.com/openai/...`). If Git is not installed, `pip install` will fail.
- **Download**: [git-scm.com/downloads](https://git-scm.com/downloads)
- _Verification_: Open your terminal and run `git --version`

### 2. Node.js (Version 20+)

- **Why**: Required to run the React frontend and Express backend.
- **Download**: [nodejs.org](https://nodejs.org/) (Choose the LTS version)
- _Verification_: Run `node -v` and `npm -v`

### 3. Python (Version 3.10 or 3.11 recommended)

- **Why**: Required to run the AI Service (FastAPI + PyTorch + CLIP).
- **Download**: [python.org/downloads](https://www.python.org/downloads/)
- > [!IMPORTANT]
  > During installation on Windows, check the box that says **"Add Python to PATH"**.
- _Verification_: Run `python --version` and `pip --version`

### 4. MongoDB

You have two options for the database:

- **Option A: Local Database (Recommended for Offline/Local Dev)**
  - Install **MongoDB Community Server**: [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
  - Install **MongoDB Compass** (Graphical interface to view data): [mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
- **Option B: Cloud Database (MongoDB Atlas)**
  - Create a free cluster on [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)

### 5. Ollama & Mistral-Nemo (Local or Remote Device)

- **Why**: Powers the local AI tailoring advisor chatbot without third-party API costs.
- **Download**: [ollama.com](https://ollama.com/)

#### Option A: Running Ollama on the Same Computer
1. Install Ollama from [ollama.com](https://ollama.com/).
2. Pull the model:
   ```bash
   ollama pull mistral-nemo:latest
   ```
3. The backend defaults to `OLLAMA_BASE_URL=http://localhost:11434`.

#### Option B: Running Ollama on Another Device (LAN / Separate PC / Server)
If you want to host Ollama and `mistral-nemo` on a separate computer (Device B) and access it from your development machine (Device A):

1. **On Device B (the machine running Ollama)**:
   - Install Ollama and pull the model:
     ```bash
     ollama pull mistral-nemo:latest
     ```
   - **Expose Ollama to the local network**:
     - **Windows**:
       1. Open Start Menu -> search **"Environment Variables"** -> select **"Edit the system environment variables"**.
       2. Click **Environment Variables...** -> Under User/System variables, click **New**.
       3. Variable name: `OLLAMA_HOST`
       4. Variable value: `0.0.0.0`
       5. Click **OK**. Right-click the Ollama tray icon and click **Quit**, then restart Ollama.
       6. Allow port `11434` in Windows Defender Firewall (Inbound Rules -> New Rule -> Port -> 11434 -> Allow Connection).
     - **Linux**:
       ```bash
       sudo systemctl edit ollama.service
       ```
       Add:
       ```ini
       [Service]
       Environment="OLLAMA_HOST=0.0.0.0"
       ```
       Save, then run `sudo systemctl daemon-reload && sudo systemctl restart ollama`.
     - **macOS**:
       ```bash
       launchctl setenv OLLAMA_HOST "0.0.0.0"
       ```
       Restart the Ollama app.
   - **Find Device B's Local IP Address**:
     - Windows: Run `ipconfig` (note the IPv4 Address, e.g., `192.168.1.50` or `192.168.8.105`).
     - Mac/Linux: Run `ip a` or `ifconfig`.

2. **On Device A (the machine running the Backend)**:
   - In `backend/.env`, set:
     ```ini
     OLLAMA_BASE_URL=http://<DEVICE_B_IP>:11434
     OLLAMA_MODEL=mistral-nemo:latest
     ```
     *(Example: `OLLAMA_BASE_URL=http://192.168.1.50:11434`)*
   - Test connectivity from Device A by running:
     ```bash
     cd backend
     npm run test:ollama
     ```

---

## 🛠️ Step-by-Step Setup

### Step 1: Copy/Clone the Code

Copy the project folder to the new computer, or clone it using Git:

```bash
git clone <your-repository-url>
cd fashion-girl
```

---

### Step 2: Configure & Run the Backend

1. **Navigate to the Backend Folder**:
   Open a terminal and go into the `backend` directory:

   ```bash
   cd backend
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to a new file named `.env`:
   - **Windows (PowerShell)**:
     ```powershell
     copy .env.example .env
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```

3. **Edit the `.env` File**:
   Open `.env` in a text editor (e.g. VS Code or Notepad).
   - **If using local MongoDB**: You don't need to change anything! The backend will automatically default to `mongodb://localhost:27017/fashiongirl`.
   - **If using MongoDB Atlas**: Fill in the database variables:
     ```ini
     MONGO_USER=your_db_username
     MONGO_PASSWORD=your_db_password
     MONGO_CLUSTER=cluster0.xxxx.mongodb.net
     MONGO_DB_NAME=fashiongirl
     ```
   - Make sure `JWT_SECRET` is set to a random, secure string.
   - Make sure the `OLLAMA_URL` is pointing to `http://localhost:11434/api/chat` (if Ollama is running).

4. **Install Dependencies**:
   Run the following command to download Node packages:

   ```bash
   npm install
   ```

5. **Start the Backend**:
   Run the backend in development mode (with auto-reload):
   ```bash
   npm run dev
   ```
   _You should see a message in the terminal:_ `MongoDB Connected: localhost` (or your Atlas host).
   - **Default Seed Users**: On startup, the database is automatically populated with default users if they don't exist:
     - **Admin**: `admin@gmail.com` / `admin123`
     - **Staff**: `staff@gmail.com` / `staff123`
     - **Vendor**: `vendor@gmail.com` / `vendor123`
     - **User/Customer**: `user@gmail.com` / `user123`

---

### Step 3: Configure & Run the Frontend

1. **Open a New Terminal Window** (keep the backend terminal running!).
2. **Navigate to the Frontend Folder**:
   ```bash
   cd frontend
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Start the Frontend**:
   ```bash
   npm run dev
   ```

   - The terminal will print a link: `http://localhost:5173`.
   - Open this link in your web browser.

---

### Step 4: Configure & Run the AI Service (FastAPI)

1. **Open a Third Terminal Window** (keep both backend and frontend running).
2. **Navigate to the AI Service Folder**:

   ```bash
   cd ai-service
   ```

3. **Create a Virtual Environment**:
   It is highly recommended to isolate Python dependencies in a virtual environment:
   - **Windows**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

4. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

   > [!NOTE]
   > This command will download PyTorch, torchvision, and download the OpenAI CLIP package from GitHub. This download might take a few minutes depending on your internet connection.

5. **Create the Environment File**:
   Copy `.env.example` to `.env`:
   - **Windows (PowerShell)**:
     ```powershell
     copy .env.example .env
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```

6. **Start the AI Service**:
   Run FastAPI using Uvicorn:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   - Note: On the first startup, PyTorch will download the `ViT-B/32` CLIP model weights (~350MB). This happens automatically and only happens once.

---

## 🔍 Verification & Health Checks

Verify that everything is set up correctly by testing these links in your browser:

| Service               | Address                                                              | Expected Response                   |
| :-------------------- | :------------------------------------------------------------------- | :---------------------------------- |
| **Frontend Web App**  | [http://localhost:5173](http://localhost:5173)                       | The main React Application homepage |
| **Backend Health**    | [http://localhost:5000/api/health](http://localhost:5000/api/health) | `Backend running`                   |
| **AI Service Health** | [http://localhost:8000/health](http://localhost:8000/health)         | `"AI service running"`              |

---

## 🛠️ Troubleshooting Common Issues

### 1. `git` command not found during AI Service installation

- **Problem**: When running `pip install -r requirements.txt`, you get an error saying `git` is not installed or not in PATH.
- **Solution**: Download and install Git from [git-scm.com](https://git-scm.com/), restart your terminal, activate your virtual environment, and run the `pip install` command again.

### 2. MongoDB connection errors

- **Problem**: The backend prints `Database connection error: ...` and exits.
- **Solution**:
  - If using a local MongoDB, ensure the MongoDB service is running (on Windows, check Services -> MongoDB Server).
  - If using MongoDB Atlas, verify your connection credentials in `backend/.env`. Ensure your IP address is whitelisted in MongoDB Atlas Network Security settings.

### 3. Ollama is offline or chatbot replies with fallback tips

- **Problem**: The AI Chatbot on the vendor page says `I am currently offline from local Ollama...`
- **Solution**:
  1. Open a terminal and run `ollama run mistral-nemo:latest`.
  2. Make sure Ollama is running in the background (check your system tray icon).
  3. Verify that `backend/.env` has `OLLAMA_URL=http://localhost:11434/api/chat`.

---

## 💳 PayHere Sandbox Gateway Setup & Testing

### 1. Credentials Setup
1. Register on [sandbox.payhere.lk](https://sandbox.payhere.lk).
2. Go to **Settings** -> **Merchant Settings** and copy your `Merchant ID` and `Merchant Secret`.
3. Put them into `backend/.env`:
   ```ini
   PAYHERE_MERCHANT_ID=your_merchant_id
   PAYHERE_MERCHANT_SECRET=your_merchant_secret
   PAYHERE_SANDBOX=true
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5000
   ```

### 2. Local IPN Webhook Testing (with ngrok)
PayHere's IPN callback (`notify_url`) requires a public URL to reach your local backend:
1. Start ngrok: `ngrok http 5000`
2. Update `BACKEND_URL` in `backend/.env` with your ngrok HTTPS URL:
   ```ini
   BACKEND_URL=https://xxxx-xx-xx.ngrok-free.app
   ```
3. When testing payments in PayHere Sandbox, use:
   - **Test Card**: `4916217501611292` (Visa) or `5307732015548369` (Mastercard)
   - **Expiry**: Any future date (e.g., `12/28`)
   - **CVV**: `123`

### 3. Offline Verification Simulation
You can test the entire checksum verification & lifecycle offline by running:
```bash
cd backend
node src/test/simulatePayHere.js
```
