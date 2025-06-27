FROM python:3.12-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt /app/
COPY alembic.ini /app/

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy app directory
COPY ./app /app/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 