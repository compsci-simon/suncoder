from pyflakes import api
import ast
import _ast


def lint(source, results, function=False):
    try:
        tree = ast.parse(source)
        if function:
            containsFunction = False
            for item in tree.body:
                if type(item) == _ast.FunctionDef:
                    containsFunction = True
                    break
            if not containsFunction:
                results['errors'] = [
                    {'startLine': 1, 'startCol': 1, 'message': 'A function definition is required'}]
    except Exception as e:
        position = {'startLine': e.lineno,
                    'startCol': e.offset, 'message': 'Synatx error'}
        results['errors'] = [position]
