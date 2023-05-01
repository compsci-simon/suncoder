import socket
import json

HEADERSIZE = 32


class APIClient:
    def __init__(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    def send(self, msg):
        sock = self.sock
        if type(msg) == str:
            sock.send(bytes(f'{len(msg):<{HEADERSIZE}}{msg}', 'utf-8'))
        elif type(msg) == dict:
            msg = json.dumps(msg)
            sock.send(bytes(f'{len(msg):<{HEADERSIZE}}{msg}', 'utf-8'))
        else:
            print(f'unknown type {type(msg)}')

    def recv(self):
        sock = self.sock
        chunk = sock.recv(HEADERSIZE)
        if chunk == b'':
            raise Exception('Pipe broke')
        msg_len = int(chunk.decode('utf-8'))
        msg_bytes = b''
        while len(msg_bytes) < msg_len:
            chunk = sock.recv(min(8, msg_len - len(msg_bytes)))
            if chunk == b'':
                raise Exception('Pipe broke')
            msg_bytes += chunk
        return json.loads(msg_bytes.decode('utf-8'))

    def connect(self, host: int, port: int):
        '''Used to connect to the service'''
        self.sock.connect((host, port))

        msg = self.recv()
        print(msg)
        self.send({'type': 'manager'})
