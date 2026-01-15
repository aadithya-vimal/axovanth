# Axovanth | Enterprise Workspace OS

<div align="center">

![Version](https://img.shields.io/badge/Version-2.4.0-blue?style=for-the-badge&logo=none)
![License](https://img.shields.io/badge/License-AGPL_v3-red?style=for-the-badge&logo=gnu)
![Status](https://img.shields.io/badge/System_Status-Operational-success?style=for-the-badge&logo=statuspage)

**The Neural Network for Modern Enterprise.**<br>
Unified governance, granular access control, and seamless workflow automation.<br>
*Built for speed, security, and scale.*

[View Demo](https://axovanth-os.vercel.app) · [Report Bug](https://github.com/aadithya-vimal/axovanth/issues) · [Request Feature](https://github.com/aadithya-vimal/axovanth/issues)

</div>

---

## ⚡ Overview

**Axovanth** is a high-performance Operating System designed to replace disjointed SaaS tools with a single, real-time command center. It unifies **Identity Management (RBAC)**, **Project Workflow**, **Secure Asset Storage**, and **Encrypted Communication** into one "God-Tier" interface.

Unlike traditional dashboards that require manual refreshes, Axovanth uses a **Real-Time Sync Protocol** (powered by Convex) to propagate state changes instantly across all active nodes in an organization.

---

## 🛡️ Core Protocols (Features)

### 1. The Governance Kernel (RBAC)
A military-grade Identity Matrix for managing organizational hierarchy.
* **Identity Matrix:** High-density administrative console for managing thousands of users with zero latency.
* **Granular Privilege Control:** Define custom roles (e.g., `Super Admin`, `Workspace Lead`, `Auditor`) with specific logic scopes.
* **Terminal Actions:** Secure protocols for identity purging and role transitions, protected by confirmation guards.
* **Self-Revocation Guard:** Logic blocks preventing admins from accidentally locking themselves out.

### 2. Operational Flow Engine
A Kanban-style workflow system that treats tickets as "Living Assets."
* **Live Sync:** Updates to priority, status, or assignment reflect instantly for all users.
* **Audit Logging:** An immutable `Audit Log` records every action (transfer, resolve, reopen) for compliance.
* **Inter-Departmental Transfer:** Workspace Admins can securely transfer ticket ownership between isolated environments (e.g., *Engineering* → *Legal*).

### 3. Global Communications Grid
* **Encrypted Chat:** Organization-wide broadcasting with real-time message streaming.
* **Signal Injection:** Context-aware commenting directly within workflow tickets.
* **Attachment Protocol:** Drag-and-drop file sharing securely stored in the Asset Vault.

### 4. Infrastructure (Workspaces)
* **Departmental Nodes:** Isolated environments with separate permission boundaries.
* **Asset Vault:** Centralized, secure storage for intellectual property using Convex Storage.
* **Instant Provisioning:** Admins can spin up new workspace nodes in seconds without server restarts.

---

## 🛠️ Technology Stack

Axovanth is built on a **Bleeding Edge** stack designed for maximum performance.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) | The latest React framework with App Router and Turbopack. |
| **Backend** | [Convex](https://convex.dev/) | Real-time database function-as-a-service (FaaS). |
| **Identity** | [Clerk](https://clerk.com/) | Enterprise-grade user management and authentication. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS for high-density UI construction. |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent, lightweight vector iconography. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict static typing for mission-critical logic. |

---

## 🚀 Initialization Protocol (Getting Started)

Follow these steps to deploy your local instance of Axovanth.

### Prerequisites
* Node.js 18+
* npm or yarn

### 1. Clone the Repository
```bash
git clone [https://github.com/aadithya-vimal/axovanth.git](https://github.com/aadithya-vimal/axovanth.git)
cd axovanth

```

### 2. Install Dependencies

```bash
npm install
# or
yarn install

```

### 3. Environment Configuration

Create a `.env.local` file in the root directory and populate it with your keys:

```env
# Deployment Public URL
CONVEX_DEPLOYMENT="dev:your-convex-deployment-name"
NEXT_PUBLIC_CONVEX_URL="[https://your-convex-instance.convex.cloud](https://your-convex-instance.convex.cloud)"

# Auth Configuration (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

```

### 4. Ignite the Kernel

You need to run two terminals simultaneously to sync the backend and frontend.

**Terminal A (Backend Sync):**

```bash
npx convex dev

```

**Terminal B (Frontend):**

```bash
npm run dev

```

Access the OS at `http://localhost:3000`.

---

## 📂 Project Structure

```bash
axovanth/
├── convex/               # The Backend Kernel (Database & Functions)
│   ├── schema.ts         # Database Schema Definitions
│   ├── tickets.ts        # Workflow Logic & Audit Logs
│   ├── users.ts          # Identity Management
│   └── companies.ts      # Organization Logic
├── src/
│   ├── app/              # Next.js 16 App Router
│   │   ├── dashboard/    # Protected Application Interface
│   │   │   ├── [companyId]/
│   │   │   │   ├── admin/    # Governance Console (RBAC)
│   │   │   │   ├── chat/     # Global Comms
│   │   │   │   └── ws/       # Workspace Nodes
│   │   └── onboarding/   # Organization Discovery Logic
│   └── components/       # Reusable UI Atoms
└── public/               # Static Assets

```

---

## 📜 License: AGPL v3

This project is strictly licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**The "SaaS Loophole" is closed.**

* ✅ **You can** use this software for private or commercial purposes.
* ✅ **You can** modify the code.
* ⚠️ **IF** you modify the code and provide it as a service (SaaS) to others over a network, you **MUST** release your modified source code to the community under the same license.
* ❌ **You cannot** close-source this project or its derivatives if you are distributing it or running it as a network service.

See the `LICENSE` file for the full legal text.

---

## 🤝 Contribution

Transmissions (Pull Requests) are welcome. Please ensure all contributions adhere to the **High-Density Design System** and pass all security checks.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-protocol`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

---

<div align="center">

**Engineered by Aadithya Vimal**




*System Status: Operational*

</div>

```