FROM --platform=linux/amd64 python:3.9

WORKDIR /app
COPY . .
RUN pip install -U setuptools pip
RUN pip3 install --upgrade pip & pip3 install -r requirements.txt
WORKDIR /
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]