# Leo Frontend

This repository contains a **Next.js frontend for Leo Studio’s photo delivery workflow**.

## What this app does

- Provides a **client portal** where users can:
  - choose a photo collection (portfolio/folder),
  - unlock protected folders with a password,
  - browse and download images,
  - upload a selfie/reference image to run **AI face matching** and find their photos.
- Provides an **admin portal** where admins can:
  - access protected admin controls,
  - browse Google Drive folders/images,
  - manage collection-related settings (including password/QR-based sharing flows),
  - trigger photo-processing related actions tied to backend APIs.
- Integrates with:
  - **Google Drive** for folder and image listing via API,
  - **Supabase** for app data such as admin/folder controls,
  - a separate backend (`NEXT_PUBLIC_BASE_URL`) for face-match and processing endpoints.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + Radix UI components
