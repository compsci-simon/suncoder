FROM python

WORKDIR /usr/src/app

COPY . .

RUN pip3 install astor graphviz func_timeout autopep8 networkx PyYAML

CMD ["python3", "-u", "worker.py"]