# PDF Genius - Guía de Instalación Local / Local Setup Guide

## 🇪🇸 Español

### Configuración de la Base de Datos (Para tus clientes/usuarios)
Como creador de este SaaS, tienes una gran pregunta: *"¿Cómo hago para que mis usuarios usen su propia base de datos y no consuman mis recursos?"*

La respuesta es que el software debe ser **"Self-Hosted" (Auto-alojado)** o permitir configuración de credenciales por inquilino (Tenant). 
Cuando vendas el software, entregarás el código fuente o una imagen Docker. El usuario final deberá:

1. Crear su propia cuenta en Firebase o un servidor PostgreSQL.
2. Copiar el archivo `.env.example` a un nuevo archivo llamado `.env`.
3. Llenar los valores en el archivo `.env` con **sus propias** credenciales de base de datos y su propia clave de la API de IA (Ej: `GEMINI_API_KEY`).

De esta manera, toda la información, los costos de almacenamiento y las consultas a la IA correrán por cuenta y riesgo del cliente que compró tu software.

### Pasos para probar este proyecto en tu computadora local:

1. **Instalar dependencias:**
   Abre una terminal en esta carpeta y ejecuta:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example`, renómbralo a `.env` y coloca tu API Key de Gemini (`GEMINI_API_KEY`).

3. **Ejecutar el servidor de desarrollo:**
   Ejecuta:
   ```bash
   npm run dev
   ```
   Abre `http://localhost:3000` (o el puerto que te indique la consola) en tu navegador.

4. **Para compilar para producción (Si vas a venderlo o distribuirlo):**
   ```bash
   npm run build
   ```

---

## 🇬🇧 English

### Database Configuration (For your customers/users)
As the creator of this SaaS, you asking: *"How do I make my users use their own database and not consume my resources?"*

The answer is that the software must be **Self-Hosted** or allow credential configuration per tenant.
When you sell the software, you will provide the source code or a Docker image. The end-user must:

1. Create their own Firebase account or a PostgreSQL server.
2. Copy the `.env.example` file to a new file named `.env`.
3. Fill in the values in the `.env` file with **their own** database credentials and their own AI API key (e.g., `GEMINI_API_KEY`).

This way, all data, storage costs, and AI queries will be billed to the customer who bought your software, not you.

### Steps to test this project on your local machine:

1. **Install dependencies:**
   Open a terminal in this folder and run:
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy the `.env.example` file, rename it to `.env`, and add your Gemini API Key (`GEMINI_API_KEY`).

3. **Run the development server:**
   Run:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or the port shown in your console) in your browser.

4. **To build for production (If you are going to sell or distribute it):**
   ```bash
   npm run build
   ```
