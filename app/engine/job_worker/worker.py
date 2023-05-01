import copy
import sys
from feedback import webTests
import socket
import verification
import time
import json
from io import StringIO
import time
import sys
import os
import traceback

HOST = os.environ.get('JOB_SERVER_URI') if os.environ.get(
    'JOB_SERVER_URI') else 'server'
PORT = int(os.environ.get('JOB_SERVER_PORT')) if os.environ.get(
    'JOB_SERVER_PORT') else 1234
HEADERSIZE = 32


class Worker():
    def __init__(self):
        self.hostname = socket.gethostname()
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    def connect(self):
        time.sleep(5)
        # self.sock.connect((HOST, PORT))
        self.sock.connect(('localhost', PORT))

        msg = self.recv()
        print(f'SERVER: {msg["msg"]}')
        self.send({'type': 'worker', 'hostname': self.hostname})
        self.listen()

    def recv(self):
        chunk = self.sock.recv(HEADERSIZE)
        if chunk == b'':
            print('\033[1;31mENGINE: Pipe broke\033[0m')
            sys.exit()
        msg_len = int(chunk.decode('utf-8'))
        msg_bytes = b''
        while len(msg_bytes) < msg_len:
            remaing = min(8, msg_len - len(msg_bytes))
            chunk = self.sock.recv(remaing)
            if chunk == b'':
                print('Pipe broke')
                sys.exit()
            msg_bytes += chunk
        return json.loads(msg_bytes.decode('utf-8'))

    def send(self, msg):
        if type(msg) != dict and type(msg) != list:
            raise Exception('Can only send objects')
        msg = json.dumps(msg)
        self.sock.send(bytes(f'{len(msg):<{HEADERSIZE}}{msg}', 'utf-8'))

    def listen(self):
        print('ENGINE: Listening...')
        job_count = 0
        while True:
            try:
                job_count += 1
                batch = self.recv()
                print(
                    f'ENGINE: Received batch {job_count}, jobs: {batch["job_ids"]}')
                for job in batch['jobs']:
                    with open('program.py', 'w') as f:
                        f.write(job['program'])
                    temp_out = StringIO()
                    sys.stderr = temp_out
                    start = time.time()
                    obj = None
                    try:
                        c = copy.deepcopy(job['obj'])
                        c['hint type'] = 'c'
                        verification.verify(c)
                        start = time.time()
                        obj = webTests(c, 'program.py')
                        runtime = time.time() - start
                        job['results'] = obj
                        job['results']['runtime'] = runtime*1000
                        job['status'] = 'exit'
                        print(f'ENGINE: Completed job {job_count}')
                    except Exception as e:
                        tb_str = traceback.format_exc()
                        out = temp_out.getvalue()
                        job['err'] = str(out)
                        job['exception'] = str(tb_str)
                        job['results'] = {}
                        job['exit_status'] = 1
                        job['test cases'] = c['test cases']
                        print(f'ENGINE: Failed job - exception: {tb_str}')
                    self.send({'type': 'job', 'payload': job})
                self.send({'type': 'status', 'payload': 'idle'})
            except Exception as e:
                exc_type, exc_obj, exc_tb = sys.exc_info()
                fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
                print(
                    f'\033[1;31mENGINE: {e}. {exc_type} in {fname} on line {exc_tb.tb_lineno}\033[0m')
                break


Worker().connect()
