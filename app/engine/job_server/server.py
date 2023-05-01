import socket
import threading
from uuid import uuid4 as gen_id
import docker
import json
import time
import sys
import os

HOST = '0.0.0.0'
PORT = int(os.environ.get('JOB_SERVER_PORT')) if os.environ.get(
    'JOB_SERVER_PORT') else 1234
GET_CRASH_LOGS = bool(os.environ.get('GET_CRASH_LOGS'))
HEADERSIZE = 32


class Server():
    def __init__(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.boss = None
        self.workers = []
        self.job_q = {}
        self.waiting_q = {}
        self.exit_q = {}
        if GET_CRASH_LOGS:
            self.docker_client = docker.DockerClient(
                base_url='unix://var/run/docker.sock')
        self.lock = threading.Lock()
        self.job_batch_size = 10

    @staticmethod
    def handle_worker(sock, server):
        server.check_waiting_q()
        while True:
            try:
                msg = Server.recv(sock)
                if msg['type'] == 'job':
                    job = msg['payload']
                    print(f'WORKER: Job completion: {job["uuid"]}')
                    server.job_quit(job)
                elif msg['type'] == 'status':
                    jobs = server.get_jobs()
                    if len(jobs) == 0:
                        server.set_worker_status(sock, 'idle')
                    else:
                        job_ids = list(map(lambda job: job['uuid'], jobs))
                        Server.send({'job_ids': job_ids, 'jobs': jobs}, sock)
            except Exception as e:
                print(f'\033[1;31mWORKER ERROR: {e}')
                server.disconnect_socket(sock, 'worker')
                break

    @staticmethod
    def handle_boss(sock, server):
        while True:
            try:
                instruction = Server.recv(sock)
                if instruction['type'] == 'create_job':
                    uid = gen_id().hex
                    instruction['uuid'] = uid
                    print(f'SERVER: Job created - {uid}')
                    instruction['time'] = time.time()
                    server.create_job(instruction)
                    Server.send({'uuid': uid}, sock)
                elif instruction['type'] == 'get_job':
                    print(
                        f'SERVER: Getting job status - {instruction["uuid"]}')
                    result = server.get_job(instruction)
                    Server.send(result, sock)
                elif instruction['type'] == 'get_failed':
                    print(f'SERVER: Getting failed jobs')
                    result = server.get_failed_jobs()
                    Server.send(result, sock)
                elif instruction['type'] == 'set_batch_size':
                    server.job_batch_size = instruction['payload']
                    Server.send(
                        {'message': f'Batch size set to size: {instruction["payload"]}'}, sock)
                else:
                    print(
                        f"MANAGER: unrecognized instruction: {instruction['type']}\n\n")
            except Exception as e:
                print(f'\033[1;31mMANAGER: {e}')
                server.disconnect_socket(sock, 'boss')
                break

    def check_waiting_q(self):
        next_job = self.find_next_job()
        if next_job is not None:
            self.create_job(next_job)

    def get_failed_jobs(self):
        exited = list(
            filter(lambda job: job['exit_status'] == 1, self.exit_q.values()))
        return exited

    def find_next_job(self):
        vals = list(self.waiting_q.values())
        sorted_vals = sorted(vals, key=lambda x: x['time'])
        if len(sorted_vals) > 0:
            item = sorted_vals[0]
            del self.waiting_q[item['uuid']]
            return item
        else:
            return None

    def get_jobs(self):
        self.lock.acquire()
        vals = list(self.waiting_q.values())
        sorted_vals = sorted(vals, key=lambda x: x['time'])
        jobs = []
        for item in sorted_vals:
            jobs.append(item)
            del self.waiting_q[item['uuid']]
            self.job_q[item['uuid']] = item
            if len(jobs) >= self.job_batch_size:
                break
        self.lock.release()
        return jobs

    def set_worker_status(self, socket, status):
        try:
            self.lock.acquire()
            if status == 'idle':
                print(
                    f'\n\n\nSERVER: len(job_q) == {len(self.job_q)}\nSERVER: len(waiting_q) == {len(self.waiting_q)}\nSERVER: len(exit_q) == {len(self.exit_q)}')
            for worker in self.workers:
                if worker['socket'] == socket:
                    worker['status'] = status
                    print(f'SERVER: Set {worker["hostname"]} to {status}')
        finally:
            self.lock.release()

    def create_job(self, job):
        try:
            self.lock.acquire()
            added = False
            for worker in self.workers:
                if worker['status'] == 'idle':
                    Server.send(
                        {'job_ids': [job['uuid']], 'jobs': [job]}, worker['socket'])
                    worker['status'] = 'busy'
                    job['worker'] = worker['hostname']
                    self.job_q[job['uuid']] = job
                    added = True
                    break
            if not added:
                self.waiting_q[job['uuid']] = job
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            print(
                f'\033[1;31mSERVER: {e}\n{exc_type} in {fname} on line {exc_tb.tb_lineno}')
        finally:
            self.lock.release()

    def get_job(self, job):
        to_return = {'status': 'not found'}
        try:
            self.lock.acquire()
            if job['uuid'] in self.job_q:
                job['status'] = 'busy'
                to_return = job
            elif job['uuid'] in self.exit_q:
                item = self.exit_q[job['uuid']]
                if len(self.exit_q) > 10000:
                    del self.exit_q[job['uuid']]
                to_return = item
            elif job['uuid'] in self.waiting_q:
                job['status'] = 'waiting'
                to_return = job
        except Exception as e:
            print(f'\033[1;31mSERVER: {e}')
        finally:
            self.lock.release()
            return to_return

    def job_quit(self, job):
        try:
            self.lock.acquire()
            del self.job_q[job['uuid']]
            job['exit_status'] = 0
            job['status'] = 'exit'
            self.exit_q[job['uuid']] = job
        finally:
            self.lock.release()

    def disconnect_socket(self, socket, type):
        if type == 'boss':
            self.boss = None
        else:
            try:
                print('SERVER: Disconnecting worker...')
                self.lock.acquire()
                self.waiting_q = {}
                item = next(
                    item for item in self.workers if item['socket'] == socket)
                self.workers.remove(item)
                hostname = item['hostname']
                print(f'SERVER: Worker hostname = {hostname}')
                if GET_CRASH_LOGS:
                    containers = self.docker_client.containers.list(
                        filters={'id': hostname})
                    jobs = list(
                        filter(lambda job: job['worker'] == hostname, self.job_q.values()))
                    if len(jobs) == 1 and len(containers) == 1:
                        container = containers[0]
                        job = jobs[0]
                        del self.job_q[job['uuid']]
                        job['exit_status'] = 1
                        job['status'] = 'exit'
                        job['logs'] = container.logs().decode('utf-8')
                        self.exit_q[job['uuid']] = job
                        print(
                            f'SERVER: Container {hostname} exited with non zero status code.')
                    if len(containers) == 1:
                        container.remove(force=True)
                    else:
                        print('SERVER: Container not found')
            except Exception as e:
                print(f'\033[1;31m SERVER ERRROR: {e}')
            finally:
                print(f'SERVER: workers = {self.workers}')
                self.lock.release()

    @staticmethod
    def send(msg, socket):
        if socket is None:
            raise Exception('No socket was given when one is needed')
        elif msg is None or msg == '':
            raise Exception('Message may not be empty')
        if type(msg) != dict and type(msg) != list:
            raise Exception('Can only send objects')
        msg = json.dumps(msg)
        socket.send(bytes(f'{len(msg):<{HEADERSIZE}}{msg}', 'utf-8'))

    @staticmethod
    def recv(socket):
        if socket is None:
            raise Exception('Socket should not be None!')
        chunk = socket.recv(HEADERSIZE)
        if chunk == b'':
            raise Exception('Pipe broke')
        msg_len = int(chunk.decode('utf-8'))
        msg_bytes = b''
        while len(msg_bytes) < msg_len:
            remaing = min(8, msg_len - len(msg_bytes))
            chunk = socket.recv(remaing)
            if chunk == b'':
                print('Pipe broke')
                sys.exit()
            msg_bytes += chunk
        return json.loads(msg_bytes.decode('utf-8'))

    def listen(self):
        self.sock.bind((HOST, PORT))
        self.sock.listen(HEADERSIZE)
        print('SERVER: Server started...\n\n')
        while True:
            socket, address = self.sock.accept()
            print(
                f'SERVER: Connection from {str(address)} has been established')
            Server.send({'msg': 'Welcome to the server'}, socket)
            msg = Server.recv(socket)
            if type(msg) != dict:
                continue
            if msg['type'] == 'manager':
                threading.Thread(
                    target=self.handle_boss, args=(socket, self,)).start()
                self.boss = {'type': 'manager', 'socket': socket}
                print('SERVER: Manger connected')
            elif msg['type'] == 'worker':
                self.workers.append(
                    {'type': 'worker', 'socket': socket, 'jobs': None, 'hostname': msg['hostname'], 'status': 'idle'})
                threading.Thread(
                    target=self.handle_worker, args=(socket, self,)).start()


Server().listen()
