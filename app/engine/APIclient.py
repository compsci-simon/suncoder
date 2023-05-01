import socket
import sys
import json
import time

PORT = 1234
HEADERSIZE = 32


class APIClient:
    def __init__(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    def send(self, msg):
        if type(msg) != dict and type(msg) != list:
            raise Exception('Can only send objects')
        try:
            msg = json.dumps(msg)
            self.sock.send(
                bytes(f'{len(msg):<{HEADERSIZE}}{msg}', 'utf-8'))
        except:
            raise Exception('Pipe broke')

    def recv(self):
        sock = self.sock
        chunk = sock.recv(HEADERSIZE)
        if chunk == b'':
            raise Exception('Pipe broke')
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

    def connect(self, HOST, PORT):
        self.sock.connect((HOST, PORT))

        self.recv()
        self.send({'type': 'manager'})


if __name__ == '__main__':
    obj = {
        "id": "625d2070e79548e88bec479f2cfe5a1a",
        "name": "Q1",
        "operators": [],
        "calls": [],
        "examples": [],
        'epsilon': 0,
        'timeout': 5,
        "input_outputs": [{"id": "4baa7cc12e4c43e5b270e80b784b98cd", "question_id": "625d2070e79548e88bec479f2cfe5a1a", "input": "0", "output": "0"}],
        "categories": [],
        "creator": {"id": "21aebaaff4fa441ba70ed90dc42d3352", "username": "21659583", "type": "lecturer"},
        "allowed_imports": [],
        "required_structures": [],
        "illegal_structures": [],
        "user_code_instance": ["4166c34817da4bba84f054d6bed7ad52"],
        "sample_solutions": [{"id": "5c25d6611ee5417f87b77df07d90fcad", "question_id": "625d2070e79548e88bec479f2cfe5a1a", "source": "def s(x):\n    return 0"}],
        "problem": "Q1",
        "imports": [],
        "required": {"branching": False, "classes": False, "for": False, "nested": False, "recursion": False, "while": False},
        "illegal": {"branching": False, "classes": False, "for": False, "nested": False, "recursion": False, "while": False},
        "test cases": [{"in": 0, "out": 0}], "solutions": ["def s(x):\n    return 0"]}

    program = 'def fibb(n):\r\n\tif n <= 1:\r\n\t\treturn n\r\n\treturn fibb(n - 1) + fibb(n - 2)'
    apiClient = APIClient()
    if sys.argv[1] == 'create':
        if len(sys.argv) != 5:
            print('3 args required. [create, host, port, num_jobs]')
        apiClient.connect(sys.argv[2], int(sys.argv[3]))
        for _ in range(int(sys.argv[4])):
            apiClient.send(
                {'type': 'create_job', 'obj': obj, 'program': program})
            job_id_obj = apiClient.recv()
            print(f'job_id = {job_id_obj["uuid"]}')
        apiClient.send({'type': 'get_job', 'uuid': job_id_obj['uuid']})
        msg = apiClient.recv()
    elif sys.argv[1] == 'failed':
        apiClient.connect(1235)
        apiClient.send({'type': 'get_failed'})
        msg = apiClient.recv()
        print(f'failed = {msg}')
    elif sys.argv[1] == 'get_job':
        if len(sys.argv) != 5:
            print('3 args required. [get_job, host, port, job_id]')
        apiClient.connect(sys.argv[2], int(sys.argv[3]))
        apiClient.send({'type': 'get_job', 'uuid': sys.argv[4]})
        msg = apiClient.recv()
        # print(msg)
    elif sys.argv[1] == 'verify':
        if len(sys.argv) > 2:
            print('Too many arugments given')
            sys.exit(1)
        apiClient.connect(1235)
        with open('./verification_worker/object.json') as f:
            file_string = f.read()
        obj = json.loads(file_string)
        apiClient.send({'type': 'create_job', 'obj': obj})
        job_id_obj = apiClient.recv()
        print(f'job_id = {job_id_obj["uuid"]}')
        apiClient.send({'type': 'get_job', 'uuid': job_id_obj['uuid']})
        msg = apiClient.recv()
        print(msg)
    elif sys.argv[1] == 'get_v':
        job_id = sys.argv[2]
        apiClient.connect(1235)
        apiClient.send({'type': 'get_job', 'uuid': job_id})
        msg = apiClient.recv()
        print(msg)
    elif sys.argv[1] == 'test1':
        if len(sys.argv) != 5:
            print('4 args required. [test1, host, port, num_jobs]')
        apiClient.connect(sys.argv[2], int(sys.argv[3]))
        job_ids = []
        start = time.time()
        for _ in range(int(sys.argv[4])):
            apiClient.send(
                {'type': 'create_job', 'obj': obj, 'program': program})
            job_id_obj = apiClient.recv()
            job_ids.append(job_id_obj["uuid"])
            # print(f'job_id = {job_id_obj["uuid"]}')
        for job_id in job_ids:
            apiClient.send({'type': 'get_job', 'uuid': job_id})
            job_id_obj = apiClient.recv()
            while job_id_obj['status'] != 'exit':
                time.sleep(0.01)
                apiClient.send({'type': 'get_job', 'uuid': job_id})
                job_id_obj = apiClient.recv()
        print(f'elapsed time = {time.time() - start}')
    elif sys.argv[1] == 'set_batch_size':
        if len(sys.argv) != 5:
            print('4 args required. [set_batch_size, host, port, batch_size]')
        apiClient.connect(sys.argv[2], int(sys.argv[3]))
        apiClient.send({'type': 'set_batch_size', 'payload': int(sys.argv[4])})
        msg = apiClient.recv()
        print(msg)
    else:
        print(f'unrecognised command {sys.argv[1]}')
