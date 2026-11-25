<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Zidd - a three-tier Dockerized Notes application demonstrating practical Docker and DevOps concepts.">
 
</head>
<body>
<main>
  <header>
    <h1>Zidd — Dockerized Notes Application</h1>
    <p class="tagline">A practical three-tier application for learning containerization and core DevOps workflows.</p>
    <p class="intro">
      Zidd is a simple Notes application with an Nginx frontend, a Node.js/Express API,
      and a PostgreSQL database. The focus of this project is not just the application
      itself, but how its services are packaged, connected, isolated, monitored, and
      operated using Docker and Docker Compose.
    </p>
    <div class="chips">
      <span class="chip">Docker</span><span class="chip">Docker Compose</span>
      <span class="chip">Nginx</span><span class="chip">Node.js</span>
      <span class="chip">PostgreSQL</span><span class="chip">Linux</span>
    </div>
  </header>

  <section>
    <h2>1. Understand the application</h2>
    <p>The application has three services, each with one main responsibility:</p>
    <table>
      <thead><tr><th>Service</th><th>Technology</th><th>What it does</th></tr></thead>
      <tbody>
        <tr><td>Frontend</td><td>Nginx Alpine</td><td>Serves the web page and forwards <code>/api/</code> requests to the backend.</td></tr>
        <tr><td>Backend</td><td>Node.js and Express</td><td>Provides the REST API, validates note input, and reads/writes notes in PostgreSQL.</td></tr>
        <tr><td>Database</td><td>PostgreSQL 16 Alpine</td><td>Stores notes and their creation timestamps.</td></tr>
      </tbody>
    </table>

    <h3>How a request travels</h3>
    <div class="flow"><pre>
Browser
   |
   | http://localhost:8080
   v
Nginx frontend (port 80 inside the container)
   |
   | /api/* requests
   v
Node.js backend (port 3000)
   |
   | SQL connection (port 5432)
   v
PostgreSQL database
   |
   v
Named volume: postgres-data
    </pre></div>
    <p>
      The browser only connects to Nginx. Nginx reverse-proxies API requests to the
      backend using the Compose service name <code>backend</code>. The backend connects
      to PostgreSQL using the service name <code>db</code>. Docker's internal DNS resolves
      these service names to container IP addresses, so the application does not need
      hard-coded container IPs.
    </p>
  </section>

  <section>
    <h2>2. Docker networking and isolation</h2>
    <p>Two user-defined bridge networks separate the application tiers:</p>
    <ul>
      <li><strong>frontend-net:</strong> connects the Nginx frontend and backend.</li>
      <li><strong>backend-net:</strong> connects the backend and PostgreSQL database.</li>
    </ul>
    <p>
      The backend belongs to both networks because it needs to receive API traffic from
      the frontend and query the database. The frontend and database do not share a
      network, so the frontend cannot directly resolve or connect to the database by its
      Compose service name.
    </p>
    <p>Only the frontend publishes a host port: <code>8080:80</code>. The backend and database ports are internal to the Docker networks.</p>
  </section>

  <section>
    <h2>3. Project structure</h2>
    <pre><code>zidd_4.0/
├── backend/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── frontend/
│   ├── default.conf
│   └── index.html
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.html</code></pre>
    <p>
      <code>backend/</code> contains the API and its image build instructions.
      <code>frontend/</code> contains the static interface and Nginx reverse-proxy
      configuration. The Compose file defines services, networks, volumes, health
      checks, dependencies, and resource limits.
    </p>
  </section>

  <section>
    <h2>4. Prerequisites</h2>
    <ul>
      <li>Docker Engine</li>
      <li>Docker Compose v2 (the <code>docker compose</code> command)</li>
      <li>Git</li>
    </ul>
    <p>Check that the tools are installed:</p>
    <pre><code>docker --version
docker compose version
git --version</code></pre>
  </section>

  <section>
    <h2>5. Run the application locally</h2>
    <h3>Step 1 — Get the source code</h3>
    <pre><code>git clone &lt;YOUR_GITHUB_REPOSITORY_URL&gt;
cd zidd_4.0</code></pre>

    <h3>Step 2 — Create your environment file</h3>
    <pre><code>cp .env.example .env</code></pre>
    <p>Open <code>.env</code> and set your own database credentials. The example file uses these variable names:</p>
    <pre><code>POSTGRES_DB=notesdb
POSTGRES_USER=notesuser
POSTGRES_PASSWORD=replace_with_a_strong_password

DB_HOST=db
DB_PORT=5432
DB_NAME=notesdb
DB_USER=notesuser
DB_PASSWORD=replace_with_the_same_password</code></pre>
    <p>
      Use matching database name, username, and password values for PostgreSQL and the
      backend. Keep the actual <code>.env</code> file private; commit only
      <code>.env.example</code>.
    </p>

    <h3>Step 3 — Build and start the services</h3>
    <pre><code>docker compose up -d --build</code></pre>
    <p>This builds the backend image from <code>backend/Dockerfile</code> and starts the frontend, backend, and database in the background.</p>

    <h3>Step 4 — Verify service status</h3>
    <pre><code>docker compose ps</code></pre>
    <p>The database and backend should become <code>healthy</code>. The frontend should be running. The backend health check also checks database connectivity.</p>

    <h3>Step 5 — Open the application</h3>
    <p>Visit <a href="http://localhost:8080">http://localhost:8080</a> in your browser.</p>
  </section>

  <section>
    <h2>6. API reference</h2>
    <table>
      <thead><tr><th>Method</th><th>Path</th><th>Purpose</th></tr></thead>
      <tbody>
        <tr><td>GET</td><td><code>/api/health</code></td><td>Checks API and database connectivity.</td></tr>
        <tr><td>GET</td><td><code>/api/notes</code></td><td>Returns the saved notes.</td></tr>
        <tr><td>POST</td><td><code>/api/notes</code></td><td>Creates a note from a JSON request body.</td></tr>
      </tbody>
    </table>
    <h3>Check health</h3>
    <pre><code>curl http://localhost:8080/api/health</code></pre>
    <h3>List notes</h3>
    <pre><code>curl http://localhost:8080/api/notes</code></pre>
    <h3>Create a note</h3>
    <pre><code>curl -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{"content":"My first note from the API"}'</code></pre>
  </section>

  <section>
    <h2>7. Persistence: why the named volume matters</h2>
    <p>
      PostgreSQL stores its database files in the named volume
      <code>postgres-data</code>, mounted at
      <code>/var/lib/postgresql/data</code>. This means the data is kept separately
      from the database container's writable layer.
    </p>
    <p>To test persistence:</p>
    <ol>
      <li>Create a note in the application.</li>
      <li>Run <code>docker compose down</code>.</li>
      <li>Start the stack again with <code>docker compose up -d</code>.</li>
      <li>Fetch the notes again. The earlier note should still exist.</li>
    </ol>    Repositories
    notes-backend
    General

Using 0 of 1 private repositories. 
kartik1160/notes-backend
Last pushed 1 minute ago•

Repository size: 60.6 MB
•
0
•

0

Add a description

Add a category
Docker commands

To push a new tag to this repository:

docker push kartik1160/notes-backend:tagname

Tags

Docker Scout Inactive
Activate

This repository contains 1 tag(s).
Tag	OS	Type	Pulled	Pushed

1.0
	
	Image	less than 1 day	1 minute

See all
Repository overview
INCOMPLETE

An overview describes what your image does and how to run it. It displays in the public view of your repository once you have pushed some content.

Build with
Docker Build Cloud

Accelerate image build times with access to cloud-based builders and shared cache.

Docker Build Cloud executes builds on optimally-dimensioned cloud infrastructure with dedicated per-organization isolation.

Get faster builds through shared caching across your team, native multi-platform support, and encrypted data transfer - all without managing infrastructure.

Go to Docker Build Cloud
    <div class="note warning">
      <strong>Data-loss warning:</strong> <code>docker compose down -v</code> removes
      the Compose-managed named volume as well as the containers and networks. This
      deletes the persisted database data. Do not use it unless you intentionally want
      to reset the database.
    </div>
  </section>

  <section>
    <h2>8. Useful Docker operations</h2>
    <h3>View service status</h3>
    <pre><code>docker compose ps</code></pre>
    <h3>View logs</h3>
    <pre><code>docker compose logs
docker compose logs -f backend</code></pre>
    <h3>Monitor container resource usage</h3>
    <pre><code>docker stats</code></pre>
    <h3>Stop the application</h3>
    <pre><code>docker compose down</code></pre>
    <p>This removes the containers and project networks while retaining the named database volume.</p>
  </section>

  <section>
    <h2>9. Docker Hub image</h2>
    <p>The backend image is configured with this image name and tag:</p>
    <pre><code>kartik1160/notes-backend</code></pre>
    <p>After the image has been published to Docker Hub, it can be downloaded with:</p>
    <pre><code>docker pull kartik1160/notes-backend:1.0</code></pre>
    <p>
      The Compose configuration in this repository also includes a local build
      definition for the backend. Therefore, the standard getting-started command
      builds the image from the checked-out source code.
    </p>
  </section>

  <section>
    <h2>10. Security and configuration notes</h2>
    <ul>
      <li>Do not commit <code>.env</code>; it contains credentials.</li>
      <li>Use <code>.env.example</code> to document the required configuration without exposing secrets.</li>
      <li>The backend container runs as a non-root user.</li>
      <li>The database and backend ports are not published to the host in this Compose setup.</li>
      <li>Container memory limits are configured in the Compose file; actual usage can be inspected with <code>docker stats</code>.</li>
    </ul>
  </section>

  <section>
    <h2>11. What this project demonstrates</h2>
    <ul>
      <li>Writing a Dockerfile and building a custom application image.</li>
      <li>Running a multi-service application with Docker Compose.</li>
      <li>Connecting services through user-defined bridge networks and Docker DNS.</li>
      <li>Separating network access between application tiers.</li>
      <li>Persisting database data with a named volume.</li>
      <li>Using health checks and startup dependencies.</li>
      <li>Configuring Nginx as a reverse proxy.</li>
      <li>Managing environment configuration and avoiding committed secrets.</li>
      <li>Inspecting logs, container status, and resource usage.</li>
    </ul>
  </section>

  <section>
    <h2>12. Possible next improvements</h2>
    <ul>
      <li>Add automated backend/API tests.</li>
      <li>Create a GitHub Actions workflow to test, build, and publish the image.</li>
      <li>Deploy the stack to an AWS EC2 instance.</li>
      <li>Provision infrastructure using Terraform.</li>
      <li>Add monitoring and dashboards with Prometheus and Grafana.</li>
      <li>Configure a domain name and HTTPS for a public deployment.</li>
    </ul>
  </section>

  <footer>
    <strong>Author: Kartik Kalyanshetti</strong>
    <p>Zidd is a hands-on learning project focused on Docker, Linux, networking, application deployment, and DevOps fundamentals.</p>
  </footer>
</main>
</body>
</html>
