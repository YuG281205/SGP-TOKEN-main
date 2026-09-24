# SGP Token Main

A Django-based backend for the SGP Token project, with REST APIs, authentication, AI-assisted workflows, document processing, and optimization/comparison tools.

## Overview

This repository contains the server-side application for SGP Token Main. The project is organized around a Django application and includes modules for:

- User accounts and authentication
- REST API endpoints
- Comparison workflows
- Optimization workflows
- AI and language-model integrations
- Vector search and embeddings
- Browser automation and HTTP integrations

## Technology Stack

- **Python**
- **Django 5.2**
- **Django REST Framework**
- **JWT authentication** with Simple JWT
- **MySQL** via `mysqlclient`
- **Google Gemini** and LangChain integrations
- **ChromaDB** for vector storage
- **PyTorch**, Transformers, and sentence-transformers
- **Playwright** for browser automation
- **Gunicorn** and WhiteNoise for deployment

## Project Structure

```text
SGP-TOKEN-main/
├── frontend/
│   ├── apps/
│   │   ├── accounts/       # User and authentication functionality
│   │   ├── api/            # API functionality
│   │   ├── comparison1/    # Comparison workflows
│   │   └── optimizer/      # Optimization workflows
│   ├── frontend/            # Django project configuration
│   ├── static/              # Static assets
│   └── manage.py            # Django management entry point
├── requirements.txt         # Python dependencies
└── README.md
```

## Prerequisites

- Python 3.10 or newer recommended
- pip
- MySQL, if using the configured database backend
- API credentials for any enabled external services, such as Google Gemini

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/YuG281205/SGP-TOKEN-main.git
   cd SGP-TOKEN-main
   ```

2. Create and activate a virtual environment:

   **macOS/Linux:**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

   **Windows PowerShell:**

   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a local environment file and configure the values required by the project. Do not commit secrets:

   ```bash
   cp .env.example .env
   ```

   If `.env.example` is not present, create `.env` manually and review `frontend/frontend/settings.py` for the required settings.

5. Run database migrations:

   ```bash
   python frontend/manage.py migrate
   ```

## Running the Development Server

Start Django from the repository root:

```bash
python frontend/manage.py runserver
```

The development server is normally available at <http://127.0.0.1:8000/>.

## Common Django Commands

```bash
# Create an administrator account
python frontend/manage.py createsuperuser

# Create migrations after model changes
python frontend/manage.py makemigrations

# Apply migrations
python frontend/manage.py migrate

# Collect static files for deployment
python frontend/manage.py collectstatic
```

## Configuration and Security

- Keep `.env` files and credentials out of version control.
- Configure the database, Django secret key, allowed hosts, CORS settings, and external AI-service credentials for each environment.
- Use a production WSGI/ASGI server rather than Django's development server in production.
- Review Django's deployment checklist before publishing the application.

## Testing

Run the project's tests with Django's test runner:

```bash
python frontend/manage.py test
```

## Deployment

The dependency set includes Gunicorn and WhiteNoise for production-oriented deployments. A typical deployment should include:

1. Installing dependencies in a production virtual environment.
2. Supplying production environment variables and database credentials.
3. Running migrations and collecting static files.
4. Starting the application with a process manager and Gunicorn.
5. Configuring HTTPS, trusted hosts, CORS, database backups, and secret management.

Example Gunicorn command:

```bash
gunicorn --chdir frontend frontend.wsgi:application
```

Adjust the command and server configuration to match your hosting environment.

## Contributing

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make and test your changes.
4. Commit and push your branch.
5. Open a pull request with a clear description of the change.

## Support

For bugs, questions, or feature requests, please [open an issue](https://github.com/YuG281205/SGP-TOKEN-main/issues).

## License

A license has not yet been specified for this repository. Add a `LICENSE` file before distributing the project under an open-source license.
