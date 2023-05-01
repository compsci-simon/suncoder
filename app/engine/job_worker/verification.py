import ast, types, sys
import re
import cfg as myCFG
import feedback as FB
from func_timeout import func_timeout, FunctionTimedOut

class program:
    """Class used to describe the properties associated with a program.

    Attributes
    ----------
    props : dictionary
        A dictionary that summarises the properties associated with a program
    """
    def __init__(self):
        self.props = {
            "imports":[],
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
    """Class used to describe the properties associated with a function.

    Attributes
    ----------
    props : dictionary
        A dictionary that summarises the properties associated with a function
    """
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
    """Helper function: used for importing sample solutions so that they can be run on test cases"""
    module = types.ModuleType(name)
    exec(code, module.__dict__)
    return module

class inputData:
    """Class describing the requirements, limitations and testing information supplied by the lecturer.

    Attributes
    ----------
    props : dictionary
        A dictionary that summarises the specifications associated with an exercise.

    Methods
    -------
    getInput(src)
        Populates an inputData object from the dicionary input
    checkConflicts(originalSolutions, epsilon(optional))
        Verifies the consistency of the specifications supplied by the lecturer
    """
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
                "classes": False
            },
            "solutions": [],
            "test cases": []
        }

    def getInput(self, input):
        """Populates an inputData object from the dicionary input

        Parameters
        ----------
        src : dictionary
            A dictionary of properties passed either directly to feedback.py or derived from a .yaml file
        """
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
                raise 'Could not complete verification as input solutions do not compile.'
        return self.checkConflicts(input["solutions"], input['epsilon'])

    def checkConflicts(self, originalSolutions, epsilon=0):
        """Verifies the consistency of the specifications supplied by the lecturer

        Parameters
        ----------
        originalSolutions : list
            A list of the solutions to the programming problem, supplied by the lecturer
        epsilon : float (optional)
            A value used to specify an allowable error when the student program returns a float
        """
        verification = {
            "containsConflicts": False,
            "required and illegal concepts": [],
            "operator consistency": [],
            "forbidden operators used": [],
            "solution consistency": {'required': [], 'illegal': []},
            "solution outputs": {'errors':[], 'failed':[]}
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
            verification["required and illegal concepts"].append('nested loops')
        if self.props["required"]["classes"] and self.props["illegal"]["classes"]:
            verification["required and illegal concepts"].append('classes')
        if self.props["required"]["recursion"] and self.props["illegal"]["branching"]:
            verification["required and illegal concepts"].append('branching')

        # check the list of supplied prohibited operators
        pythonOps = ['and', 'or','+','-','*','@','/','%','**','<<','>>','|','^','&','//','~','!','+','-','==','!=','<','<=','>','>=','is','is not','in','not in']
        if len(self.props['operators']) > 0:
            for op in self.props["operators"]:
                if op not in pythonOps:
                    if op not in verification["operator consistency"]: verification["operator consistency"].append(op)
        for src in originalSolutions:
            verification['forbidden operators used'] = checkOperators(self.props, src)

        for solution in self.props["solutions"]:
            properties = solution.props["functions"][0].props
            
            # check that supplied solutions conform with required concepts
            if self.props["required"]["for"] and not properties["for"]:
                if 'for loops' not in verification["solution consistency"]['required']: verification["solution consistency"]['required'].append('for loops')
            if self.props["required"]["while"] and not properties["while"]:
                if 'while loops' not in verification["solution consistency"]['required']: verification["solution consistency"]['required'].append('while loops')
            if self.props["required"]["branching"] and not properties["branching"]:
                if 'branching' not in verification["solution consistency"]['required']: verification["solution consistency"]['required'].append('branching')
            if self.props["required"]["recursion"] and not properties["recursion"]:
                if 'recursion' not in verification["solution consistency"]['required']: verification["solution consistency"]['required'].append('recursion')
            if self.props["required"]["nested"] and not properties["nestedLoop"]:
                if 'nested loops' not in verification["solution consistency"]['required']: verification["solution consistency"]['required'].append('nested loops')

            # check that supplied solutions conform with the illegal concepts
            if self.props["illegal"]["for"] and properties["for"]:
                if 'for loops' not in verification["solution consistency"]['illegal']: verification["solution consistency"]['illegal'].append('for loops')
            if self.props["illegal"]["while"] and properties["while"]:
                if 'while loops' not in verification["solution consistency"]['illegal']: verification["solution consistency"]['illegal'].append('while loops')
            if self.props["illegal"]["branching"] and properties["branching"]:
                if 'branching' not in verification["solution consistency"]['illegal']: verification["solution consistency"]['illegal'].append('branching')
            if self.props["illegal"]["recursion"] and properties["recursion"]:
                if 'recursion' not in verification["solution consistency"]['illegal']: verification["solution consistency"]['illegal'].append('recursion')
            if self.props["illegal"]["nested"] and properties["nestedLoop"]:
                if 'nested loops' not in verification["solution consistency"]['illegal']: verification["solution consistency"]['illegal'].append('nested loops')

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
                        if type(case['in']) == tuple: out = func_timeout(2, myFunction, case["in"])
                        else: out = myFunction(case["in"])
                        if not FB.isCorrect(out, case["out"], epsilon):
                            if caseNo not in verification['solution outputs']['failed']: verification['solution outputs']['failed'].append(caseNo)
                    except Exception as e:
                        exc_type, exc_value, exc_traceback = sys.exc_info()
                        if caseNo not in verification['solution outputs']['errors']: verification['solution outputs']['errors'].append(caseNo)
                    caseNo += 1

        if len(verification["required and illegal concepts"]) > 0 or len(verification["operator consistency"]) > 0 or len(verification["solution consistency"]['required']) > 0 or len(verification["solution consistency"]['illegal']) > 0 or len(verification["solution outputs"]['errors']) > 0 or len(verification["solution outputs"]['failed']) > 0 or len(verification['forbidden operators used']) > 0:
            verification["containsConflicts"] = True
        return verification

def checkOperators(problemInput: inputData, source):
    """Checks that a student submission does not make use of any prohibited operators

    Parameters
    ----------
    source : str
        The source code associated with a student submission
    problemInput : inputData
        The inputData information associated with the exercises specifications
    """
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
        '^':'BitXor',
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
    """Helper function: for formatting the output produced during the verification procedure to one that is appropriate for terminal use"""
    if not output['containsConflicts']:
        print(f'\033[34mLecturer input successfully verified.\033[m')
        return
    pythonOps = ['and', 'or','+','-','*','@','/','%','**','<<','>>','|','^','&','//','~','!','+','-','==','!=','<','<=','>','>=','is','is not','in','not in']
    for op in output['operator consistency']:
        print(f'{op} is not a known Python operator. Allowed operators are: {str(pythonOps)}.')
    for concept in output['required and illegal concepts']:
        print(f'This input is consistent: {concept} cannot be both required and illegal.')
    for op in output['forbidden operators used']:
        print(f'The specification prohibits the use of {op}, but it is used in one or more of the sample solutions.')
    for concept in output['solution consistency']['required']:
        print(f'The specification requires the use of {concept}, but one or more of th sample solutions do not contain {concept}.')
    for concept in output['solution consistency']['illegal']:
        print(f'The specification prohibits the use of {concept}, but one or more of th sample solutions contain {concept}.')
    for case in output['solution outputs']['errors']:
        print(f'One or more of the solutions produced errors for test case {case}.')
    for case in output['solution outputs']['failed']:
        print(f'One or more of the solutions failed test case {case}.')

def verify(input):
    """Verifies the lecturer input when the SUNCoder web interfact is being used

    returns a dictionary containing veriication information

    Parameters
    ----------
    input : dict
        The dictionary of problem parameters supplied by the lecturer
    """
    r = {'for' : False, 'while' : False, 'branching' : False, 'calls' : False, 'nested' : False, 'recursion': False, 'classes': False}
    i = {'for' : False, 'while' : False, 'branching' : False, 'calls' : False, 'nested' : False, 'recursion': False, 'classes': False}
    for structure in input['required']:
        r[structure] = True
    for structure in input['illegal']:
        i[structure] = True
    input['required'] = r
    input['illegal'] = i
    if input['hint type'] == 'w': FB.initialiseWeighted(input)
    return inputData().getInput(input)

if __name__ == '__main__':
    # ------------------------------------------------------------------------------------------------------------------------- #
    sampleMemo = {
            "problem": 'Sample problem',
            "imports": ['sys'],
            "calls": ['pow'],
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
                "branching": True,
                "recursion": False,
                "nested": False,
                "classes": False,
                "functions": False
            },
            "epsilon": 0.1e-9,
            "test cases": [{ "in": 0.01, "out": 1.010050167084168 },
                { "in": 1., "out": 2.718281828459045 },
                { "in": 3., "out": 20.085536923187668 },
                { "in": 0.1, "out": 1.1051709180756477 },
                { "in": 13, "out": 442413.3920089205 }],
            "solutions": [
            '''def exponential(x):
                k = 0.
                s = 1.
                t = 1.
                s_old = 0.
                while s != s_old:
                    s_old = s
                    k = k + 1
                    t = t * x/k
                    s = s + t
                return s'''
            ]
        }
    # ------------------------------------------------------------------------------------------------------------------------- #
    out = inputData().getInput(sampleMemo)
    print(out)
    formatVerification(out)