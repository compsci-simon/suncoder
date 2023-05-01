FROM python

WORKDIR /usr/src/app

RUN pip3 install docker

COPY server.py .

CMD ["python3", "-u", "server.py"]