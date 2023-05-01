from email import header
import time
import threading
import parser
import requests


def test_linting():
    threads = []
    small = ''
    with open('small.py', 'r') as f:
        small = f.read()
    big = ''
    with open('big.py', 'r') as f:
        big = f.read()
    url = 'http://localhost:8000/api/v1/services/lint'

    def lint():
        for _ in range(10):
            resp = requests.post(url, json={'source': big})
        # print(resp.text)

    num_threads = 100
    for i in range(num_threads):
        threads.append(threading.Thread(target=lint))

    start = time.time()
    for i in range(num_threads):
        threads[i].start()
    for i in range(num_threads):
        threads[i].join()

    print(f'service took {time.time() - start} seconds')


def lint_parser(source, results):
    try:
        parser.suite(source)
    except Exception as e:
        position = {'startLine': e.lineno, 'startCol': e.offset}
        if results['errors'] is None:
            results['errors'] = []
        results['errors'].append(position)

    return results


def lint_pyflakes(source, results):
    from io import StringIO
    import sys
    import re
    from pyflakes import api
    tmp = sys.stderr
    tmp2 = sys.stdout
    my_result = StringIO()
    sys.stdout = StringIO()
    sys.stderr = my_result
    api.check(codeString=source, filename='program.py')
    sys.stderr = tmp
    sys.stdout = tmp2
    lines = my_result.getvalue().split('\n')
    for line in lines:
        if re.search('invalid syntax', line):
            parts = line.split(':')
            position = {'startLine': parts[1], 'startCol': parts[2]}
            if results['errors'] is None:
                results['errors'] = []
            results['errors'].append(position)
    return results


def test_run_code():
    create_url = 'http://localhost:8000/api/v1/execute_code'
    status_url = 'http://localhost:8000/api/v1/job_status'
    course_id = 'a92817f5adc14e68b28b6e20e6db9bd9'
    unit_id = '276ce7b46b8c42228f0b49bb62b85cd9'
    pool_id = 'c7c926be4bdf42a6b5ecce73a6d38af7'
    question_id = '56d7db2c6543445c92caa832cc20481c'
    headers = {
        'x-pomerium-jwt-assertion': 'eyJhbGciOiAiRVMyNTYiLCAia2lkIjogImQzNzViNWUxNmI5ZDczMDViMmM5MjkxNDM0Nzk3ZDgxYmZkNTA5ZjJhNDJkZmU4NTI3ZmEyZTBlY2ExOWZjNjIiLCAidHlwIjogIkpXVCJ9.eyJhdWQiOiAic3VuY29kZXIucHJvai5jcy5zdW4uYWMuemEiLCAiZW1haWwiOiAiMjE2NTk1ODNAc3VuLmFjLnphIiwgImV4cCI6IDEuNjYzOTM4NDU3ZSswOSwgImZhbWlseV9uYW1lIjogIlN0ZXZlbnMiLCAiZ2l2ZW5fbmFtZSI6ICJTaW1vbiIsICJncm91cHMiOiBbIjA0MzBiOGZmLTI4MmItNDkxYy1iNWEwLTg2ZTc2MzhiMTQ4NiIsICIwZjdjZDhmZi04YTdlLTQwZWUtYjlhYi1hZmM5NjM4NDRjMjEiLCAiMTEzMTdlMGMtNWIxYi00N2JhLTlkZTQtN2IyMjM2YjQ2NGVhIiwgIjE4YTg2MGZhLTA2ZDUtNDE1Yi05OWE1LWYwMWZhYzhkOTg4NSIsICIxYjUxYjNmYy1kNGYwLTQwZDAtYTc4My0zNGI2NGU4M2I0YTQiLCAiMjg3NzFjZjYtZDI1ZS00OWEwLTlkM2ItM2MxOThlMTYzMjhkIiwgIjJkNzIxNzJlLTU0NWMtNDQzMy05YmU5LTRlOWZmNjMyMGU2MyIsICI0OTE3MWViNi1mMDk0LTQ0NWQtOWY4OS02ZTc0MTNlZTEyNGIiLCAiNDliMTNjMjgtODBmMS00NGU5LWIxMDgtMDY5MzJjN2VkODQ0IiwgIjRkZjI4YjE0LThiODktNDBkMy05ODA4LTQ4MjA0YzgyNzhhZSIsICI1NDc5NjNhOC02ZTg2LTQ2NDgtYjY5Yi0yZmE5YmI1MzJiOTUiLCAiNTgyMGRhNTEtNDBkNS00MzYwLWFjMDMtYzhmZjhjY2FjMmNkIiwgIjViNjY1OWI3LWMzNGMtNGU0Ny1hNmY5LWRjOWZlNGY0ZTI2MiIsICI3M2Q2NGEyZC05Yjk2LTQwYWYtYmJlNy03NmE4ZmE3Zjc4ZjIiLCAiNzUxYTc2MzctODUxNy00MTNlLWFjYzMtMDkwYmJmMTYzOTJkIiwgIjc4YmJiMzRmLWU4OTgtNDRmMy1hMWEwLTVkYmM3MTMwMTM0OSIsICI3OTUwNjA4Ny0wYTVkLTQ4YWEtOWQ2Ny02OWNlYzUxNjdiYzEiLCAiODZhNzMxNGEtNjEyZi00YWNkLThjMTgtODllZGE3OTFjNGRiIiwgIjg5YzZjNWRlLTQzYmItNDA1ZS1iY2RlLTI3ZThlM2E1MTFkNCIsICI4ZGE3ZDA3Yy05Mjg5LTQ2NTgtYWIzYi0yYmFmOGE4MDU3NmMiLCAiOTA3OWI1NDUtMTUwYy00NjQ4LTgzNDItMTVhZWVkOWJkN2MzIiwgIjkyMGRkZTFjLTFlMTEtNDc3YS1iZmIzLTBiZWUxYzA0MDMzZCIsICI5M2QxYzUxNS1mNzRkLTQxZjgtYTMzYy03ZDllOTliZWRlNDIiLCAiYTAwZTE5ZTQtNjUwZS00YTM1LWIxNDctZjFjMzZiMGFhYjM0IiwgImFiNmM1YjQxLTk3ZDMtNDMyOC1hYmM3LTI5YWM0NGM3ZWQwMCIsICJhZjk5MjUxYi1jMDZkLTQ1M2ItOTg4Zi01MzNjM2E4MGYwODciLCAiYzUxYzQxM2MtMmVmNC00MmMwLWJhNTUtYWIzNjUyMzA1NjZiIiwgImM3ZTNhNmJhLTQyYzAtNDg2Ni05ODdiLWU0NTJiN2ZmMmQzNCIsICJkZDI3MWJhYy0yNjQ2LTRiMDEtYWIxYS1hZTEyODE4MGQ4Y2YiLCAiZGViM2RkNDktZThhMi00OWNmLThlZmMtMTJlYjM3ZWY4MTE1IiwgImU2ZjM1MWRiLWMyNmEtNDYyYi05NmE0LWRjNzdhNTk3N2E2OCJdLCAiaWF0IjogMS42NjM5MTkyOThlKzA5LCAiaXNzIjogImF1dGguY3Muc3VuLmFjLnphIiwgImp0aSI6ICI0MzIzZDU4ZS0zNjlkLTQzMWUtYWU4NC1kY2NjYmZiM2VlOGUiLCAibmFtZSI6ICJTdGV2ZW5zLCBTLCBNbnIgWzIxNjU5NTgzQHN1bi5hYy56YV0iLCAicHJlZmVycmVkX3VzZXJuYW1lIjogIjIxNjU5NTgzQHN1bi5hYy56YSIsICJzaWQiOiAiNDMyM2Q1OGUtMzY5ZC00MzFlLWFlODQtZGNjY2JmYjNlZThlIiwgInN1YiI6ICIxZDEwYjdkNi01NTY1LTRiNDMtOGNjYi0wZjM2ZDBjYmI5NjkiLCAidXBuIjogIjIxNjU5NTgzQHN1bi5hYy56YSIsICJ1c2VyIjogIjFkMTBiN2Q2LTU1NjUtNGI0My04Y2NiLTBmMzZkMGNiYjk2OSIsICJ4bXNfdHBsIjogImVuIn0.g_BW_DaqEqJi1D7jcnkZfXrhTHbEpWJ3990CKDGiY7Osov6UfossZaVJ2gTh7tJnOANtgDgysOKzNwHdLqZX-A'
    }
    threads = []

    def rce():
        x = time.time()
        resp = requests.post(create_url, json={
            'question_id': question_id,
            'pool_id': pool_id,
            'unit_id': unit_id,
            'course_id': course_id,
        }, headers=headers)

        # resp = requests.get('http://localhost:8000/test')

        if resp.status_code != 200:
            print('resp error')
            return
        job_id = resp.json()['job_id']['uuid']

        print(f'sending took {time.time() - x}')

        while True:
            status = requests.get(
                f'{status_url}?job_id={job_id}', headers=headers)
            if status.status_code != 200:
                print('status error')
                return
            if status.json().get('results'):
                print(status.json().get('results')['runtime'])
                break
            time.sleep(0.01)
    num = 10
    start = time.time()
    for i in range(num):
        threads.append(threading.Thread(target=rce))
    for i in range(num):
        threads[i].start()
    for i in range(num):
        threads[i].join()
    print(f'took {time.time() - start}s')


if __name__ == "__main__":
    test_linting()
