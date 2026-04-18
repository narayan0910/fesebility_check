FROM python:3.11.15

WORKDIR /app

COPY requirements.txt .
RUN playwright install chromium
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860

CMD ["python", "main.py"]