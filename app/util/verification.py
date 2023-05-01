import ast
import types
import sys
from app.util import cfg as myCFG


class program:
    def __init__(self):
        self.props = {
            "imports": [],
            "functions": [],
            "calls": [],
            "recursive": False,
            "branching": False,
            "for": False,
            "while": False,
            "inf": False,
            "nestedLoop": False
        }


class functions:
    def __init__(self, fname):
        self.props = {
            "params": 0,
            "return": False,
            "recursive": False,
            "recursion": False,
            "base": False,
            "branching": False,
            "for": False,
            "while": False,
            "inf": False,
            "nestedLoop": False,
            "calls": []}
        self.name = fname


def import_code(code, name):
    module = types.ModuleType(name)
    exec(code, module.__dict__)
    return module


class inputData:
    def __init__(self):
        self.props = {
            "problem": '',
            "imports": [],
            "calls": [],
            "operators": [],
            "required": {
                "for": False,
                "while": False,
                "branching": False,
                "recursion": False,
                "nested": False,
                "classes": False
            },
            "illegal": {
                "for": False,
                "while": False,
                "branching": False,
                "recursion": False,
                "nested": False,
                "classes": False,
                "functions": False
            },
            "solutions": [],
            "test cases": []
        }

    def getInput(self, input):
        self.props["imports"] = input["imports"]
        self.props["calls"] = input["calls"]
        self.props["operators"] = input["operators"]
        self.props["required"] = input["required"]
        self.props["illegal"] = input["illegal"]
        self.props["test cases"] = input["test cases"]
        for solution in input["solutions"]:
            try:
                cfg = myCFG.CFGVisitor().build('sample', ast.parse(solution))
                programData = program()
                cfg.getData(False, programData)
                self.props["solutions"].append(programData)
            except Exception as e:
                print(e)
                print(solution)
                raise 'Could not complete verification as input solutions do not compile.'
        return self.checkConflicts(input["solutions"])

    # Verifies the consistency of the supplied .yaml file
    def checkConflicts(self, originalSolutions):
        verification = {
            "containsConflicts": False,
            "required and illegal concepts": [],
            "operator consistency": [],
            "forbidden operators used": [],
            "solution consistency": {'required': [], 'illegal': []},
            "solution outputs": {'errors': [], 'failed': []}
        }

        # check for conflicts between required and illegal concepts
        if self.props["required"]["for"] and self.props["illegal"]["for"]:
            verification["required and illegal concepts"].append('for loops')
        if self.props["required"]["while"] and self.props["illegal"]["while"]:
            verification["required and illegal concepts"].append('while loops')
        if self.props["required"]["branching"] and self.props["illegal"]["branching"]:
            verification["required and illegal concepts"].append('branching')
        if self.props["required"]["recursion"] and self.props["illegal"]["recursion"]:
            verification["required and illegal concepts"].append('recursion')
        if self.props["required"]["nested"] and self.props["illegal"]["nested"]:
            verification["required and illegal concepts"].append(
                'nested loops')
        if self.props["required"]["classes"] and self.props["illegal"]["classes"]:
            verification["required and illegal concepts"].append('classes')
        if self.props["required"]["recursion"] and self.props["illegal"]["branching"]:
            verification["required and illegal concepts"].append('branching')

        # check the list of supplied prohibited operators
        pythonOps = ['and', 'or', '+', '-', '*', '@', '/', '%', '**', '<<', '>>', '|', '^', '&',
                     '//', '~', '!', '+', '-', '==', '!=', '<', '<=', '>', '>=', 'is', 'is not', 'in', 'not in']
        if len(self.props['operators']) > 0:
            for op in self.props["operators"]:
                if op not in pythonOps:
                    if op not in verification["operator consistency"]:
                        verification["operator consistency"].append(op)
        for src in originalSolutions:
            verification['forbidden operators used'] = checkOperators(
                self.props, src)

        for solution in self.props["solutions"]:
            properties = solution.props["functions"][0].props

            # check that supplied solutions conform with required concepts
            if self.props["required"]["for"] and not properties["for"]:
                if 'for loops' not in verification["solution consistency"]['required']:
                    verification["solution consistency"]['required'].append(
                        'for loops')
            if self.props["required"]["while"] and not properties["while"]:
                if 'while loops' not in verification["solution consistency"]['required']:
                    verification["solution consistency"]['required'].append(
                        'while loops')
            if self.props["required"]["branching"] and not properties["branching"]:
                if 'branching' not in verification["solution consistency"]['required']:
                    verification["solution consistency"]['required'].append(
                        'branching')
            if self.props["required"]["recursion"] and not properties["recursion"]:
                if 'recursion' not in verification["solution consistency"]['required']:
                    verification["solution consistency"]['required'].append(
                        'recursion')
            if self.props["required"]["nested"] and not properties["nestedLoop"]:
                if 'nested loops' not in verification["solution consistency"]['required']:
                    verification["solution consistency"]['required'].append(
                        'nested loops')

            # check that supplied solutions conform with the illegal concepts
            if self.props["illegal"]["for"] and properties["for"]:
                if 'for loops' not in verification["solution consistency"]['illegal']:
                    verification["solution consistency"]['illegal'].append(
                        'for loops')
            if self.props["illegal"]["while"] and properties["while"]:
                if 'while loops' not in verification["solution consistency"]['illegal']:
                    verification["solution consistency"]['illegal'].append(
                        'while loops')
            if self.props["illegal"]["branching"] and properties["branching"]:
                if 'branching' not in verification["solution consistency"]['illegal']:
                    verification["solution consistency"]['illegal'].append(
                        'branching')
            if self.props["illegal"]["recursion"] and properties["recursion"]:
                if 'recursion' not in verification["solution consistency"]['illegal']:
                    verification["solution consistency"]['illegal'].append(
                        'recursion')
            if self.props["illegal"]["nested"] and properties["nestedLoop"]:
                if 'nested loops' not in verification["solution consistency"]['illegal']:
                    verification["solution consistency"]['illegal'].append(
                        'nested loops')

        # check that each supplied solution runs correctly for the supplied inputs and outputs
        for solution in originalSolutions:
            code = import_code(solution, 'test')
            availableFunctions = []
            for a in dir(code):
                if isinstance(getattr(code, a), types.FunctionType):
                    availableFunctions.append(a)
            for func in availableFunctions:
                myFunction = getattr(code, func)
                caseNo = 0
                for case in self.props["test cases"]:
                    try:
                        out = myFunction(case["in"])
                        if out != case["out"]:
                            if caseNo not in verification['solution outputs']['failed']:
                                verification['solution outputs']['failed'].append(
                                    caseNo)
                    except Exception as e:
                        exc_type, exc_value, exc_traceback = sys.exc_info()
                        if caseNo not in verification['solution outputs']['errors']:
                            verification['solution outputs']['errors'].append(
                                caseNo)
                    caseNo += 1

        if len(verification["required and illegal concepts"]) > 0 or len(verification["operator consistency"]) > 0 or len(verification["solution consistency"]['required']) > 0 or len(verification["solution consistency"]['illegal']) > 0 or len(verification["solution outputs"]['errors']) > 0 or len(verification["solution outputs"]['failed']) > 0 or len(verification['forbidden operators used']) > 0:
            verification["containsConflicts"] = True
        return verification


def checkOperators(problemInput: inputData, source):
    operatorMappping = {
        'and': 'And',
        'or': 'Or',
        '+': 'Add',
        '-': 'Sub',
        '*': 'Mult',
        '@': 'MatMult',
        '/': 'Div',
        '%': 'Mod',
        '**': 'Pow',
        '<<': 'LShift',
        '>>': 'RShift',
        '|': 'BitOr',
        '^': 'BitXor',
        '&': 'BitAnd',
        '//': 'FloorDiv',
        '~': 'Invert',
        '!': 'Not',
        '+': 'UAdd',
        '-': 'USub',
        '==': 'Eq',
        '!=': 'NotEq',
        '<': 'Lt',
        '<=': 'LtE',
        '>': 'Gt',
        '>=': 'GtE',
        'is': 'Is',
        'is not': 'IsNot',
        'in': 'In',
        'not in': 'NotIn'
    }
    ret = []
    code = ast.parse(source)
    astSummary = ast.dump(code)
    for operator in problemInput["operators"]:
        opString = 'op=' + operatorMappping[operator] + '()'
        if opString in astSummary:
            if operator not in ret:
                ret.append(operator)
    return ret


def formatVerification(output):
    if not output['containsConflicts']:
        print(f'\033[34mLecturer input successfully verified.\033[m')
        return
    pythonOps = ['and', 'or', '+', '-', '*', '@', '/', '%', '**', '<<', '>>', '|', '^', '&',
                 '//', '~', '!', '+', '-', '==', '!=', '<', '<=', '>', '>=', 'is', 'is not', 'in', 'not in']
    for op in output['operator consistency']:
        print(
            f'{op} is not a known Python operator. Allowed operators are: {str(pythonOps)}.')
    for concept in output['required and illegal concepts']:
        print(
            f'This input is consistent: {concept} cannot be both required and illegal.')
    for op in output['forbidden operators used']:
        print(
            f'The specification prohibits the use of {op}, but it is used in one or more of the sample solutions.')
    for concept in output['solution consistency']['required']:
        print(
            f'The specification requires the use of {concept}, but one or more of th sample solutions do not contain {concept}.')
    for concept in output['solution consistency']['illegal']:
        print(
            f'The specification prohibits the use of {concept}, but one or more of th sample solutions contain {concept}.')
    for case in output['solution outputs']['errors']:
        print(
            f'One or more of the solutions produced errors for test case {case}.')
    for case in output['solution outputs']['failed']:
        print(f'One or more of the solutions failed test case {case}.')
