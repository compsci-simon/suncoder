import json
import cfg as CFG
import verification as VERIFY
import sys, ast, enum, re, yaml, importlib, types, traceback, os, copy, pickle
from func_timeout import func_timeout, FunctionTimedOut
from io import StringIO
from contextlib import redirect_stdout

DEBUG = False
TERMINAL = False
SHOW_STDERR = False
SHOW_STDOUT = False
ct = 0; rt = 0; ins = 0; hint = 0; nh = 0; na = 0

def inc(c):
    """Helper function for calculating statistics about feedback types"""
    global ct, rt, ins, hint, nh, na
    if c == 'compile': ct += 1
    elif c == 'runtime': rt += 1
    elif c == 'instruct': ins += 1
    elif c == 'hint': hint += 1
    elif c == 'no hint': nh += 1
    elif c == 'na': na += 1


class program:
    """Class used to describe the properties associated with a program.

    Attributes
    ----------
    props : dict
        A dictionary that summarises the properties associated with a program

    Methods
    -------
    printProgram()
        A helper function which prints a summary of the program dictionary (for use in debugging).
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

    def printProgram(self):
        """Prints a summary of the program dictionary (for use in debugging)."""
        output = 'imports: ' + str(self.props["imports"]) + '\n'
        output += 'calls: ' + str(self.props["calls"]) + '\n'
        output += 'recursive: ' + str(self.props["recursive"]) + '\n'
        output += 'branching: ' + str(self.props["branching"]) + '\n'
        output += 'for: ' + str(self.props["for"]) + '\n'
        output += 'while: ' + str(self.props["while"]) + '\n'
        output += 'nested loops: ' + str(self.props["nestedLoop"]) + '\n'
        output += 'functions: ' + str(len(self.props["functions"])) + '\n'
        for function in self.props["functions"]:
            output += function.name + ':\n'
            output += '\t' + 'params: ' + str(function.props["params"]) + '\n'
            output += '\t' + 'return: ' + str(function.props["return"]) + '\n'
            output += '\t' + 'recursive: ' + str(function.props["recursive"]) + '\n'
            output += '\t' + 'for: ' + str(function.props["for"]) + '\n'
            output += '\t' + 'while: ' + str(function.props["while"]) + '\n'
            output += '\t' + 'recursion: ' + str(function.props["recursion"]) + '\n'
            output += '\t' + 'base case: ' + str(function.props["base"]) + '\n'
            output += '\t' + 'branching: ' + str(function.props["branching"]) + '\n'
            output += '\t' + 'nested loop: ' + str(function.props["nestedLoop"]) + '\n'
            output += '\t' + 'calls: ' + str(function.props["calls"]) + '\n'
        print(output)

class functions:
    """Class used to describe the properties associated with a function.

    Attributes
    ----------
    props : dict
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

def getFunc(prog: program, name):
    """Returns the property dictionary associated with the <name> function contained in program.

    Parameters
    ----------
    prog : program
        The dictionary of properties associated with a program
    name : str
        The name of the function, for which the property dictionary should be returned

    Raises
    ------
    Function dictionary not found
        In the event that a program does not contain a function called <name>.
    """
    for func in prog.props["functions"]:
        if func.name == name:
            return (func.props)
    raise 'Function dictionary not found'

class inputData:
    """Class describing the requirements, limitations and testing information supplied by the lecturer.

    Attributes
    ----------
    props : dict
        A dictionary that summarises the specifications associated with an exercise.

    Methods
    -------
    getInput(src)
        Populates an inputData object from the dicionary input
    printInput(src)
        A helper function which prints a summary of the program dictionary (for use in debugging).
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

    def getInput(self, src):
        """Populates an inputData object from the dicionary input

        Parameters
        ----------
        src : dict
            A dictionary of properties passed either directly to feedback.py or derived from a .yaml file
        """
        TUP = False
        for k in src:
            v = src.get(k)
            if k == 'problem':
                self.props["problem"] = v
            elif k == 'tuple' and v is not None and v == 'X':
                TUP = True
            elif k == 'imports':
                if v is not None: self.props["imports"] = v
                else: self.props["imports"] = []
            elif k == 'calls':
                if v is not None: self.props["calls"] = v
                else: self.props["calls"] = []
            elif k == 'operators' and v is not None:
                # list of operators in python: 
                # [+, -, *, /, %, **, //, =, +=, -=, *=, /=, %=, //=, **=, &=, |=, ^=, >>=, <<=, 
                # ==, !=, >, <, >=, <=, and, or, not, is, is not, in, not in, &, |, ^, ~, <<, >>]
                    self.props["operators"] = v
            elif k == 'required':
                if v["for"]:
                    self.props["required"]["for"] = True
                if v["while"]:
                    self.props["required"]["while"] = True
                if v["branching"]:
                    self.props["required"]["branching"] = True
                if v["recursion"]:
                    self.props["required"]["recursion"] = True
                if v["nested"]:
                    self.props["required"]["nested"] = True
                if v["classes"]:
                    self.props["required"]["classes"] = True
            elif k == 'illegal':
                if v["for"]:
                    self.props["illegal"]["for"] = True
                if v["while"]:
                    self.props["illegal"]["while"] = True
                if v["branching"]:
                    self.props["illegal"]["branching"] = True
                if v["recursion"]:
                    self.props["illegal"]["recursion"] = True
                if v["nested"]:
                    self.props["illegal"]["nested"] = True
                if v["classes"]:
                    self.props["illegal"]["classes"] = True
            elif k == 'solutions':
                # create a list of program properties
                for sol in v:
                    parser = CFG.PyParser(sol)
                    parser.removeCommentsAndDocstrings()
                    parser.formatCode()
                    cfg = CFG.CFGVisitor().build('sample', ast.parse(sol))
                    programData = program()
                    cfg.getData(False, programData)
                    self.props["solutions"].append(programData)
            elif k == 'test cases':
                self.props["test cases"] = v
        if TUP:
            for case in self.props['test cases']:
                case['in'] = tuple(case['in'])
        return

    def printInput(self):
        """A helper function which prints a summary of the program dictionary (for use in debugging)."""
        output = 'problem: ' + self.props["problem"] + '\n'
        output += 'allowed imports: ' + str(self.props["imports"]) + '\n'
        output += 'prohiibited calls: ' + str(self.props["calls"]) + '\n'
        output += 'prohibited operators: ' + str(self.props["operators"]) + '\n'
        output += 'type: function.\n'
        output += 'required: \n'
        output += '\t for: ' + str(self.props["required"]["for"]) + '\n'
        output += '\t while: ' + str(self.props["required"]["while"]) + '\n'
        output += '\t branching: ' + str(self.props["required"]["branching"]) + '\n'
        output += '\t nested loops: ' + str(self.props["required"]["nested"]) + '\n'
        output += '\t recursion: ' + str(self.props["required"]["recursion"]) + '\n'
        output += '\t classes: ' + str(self.props["required"]["classes"]) + '\n'
        output += 'illegal: \n'
        output += '\t for: ' + str(self.props["illegal"]["for"]) + '\n'
        output += '\t while: ' + str(self.props["illegal"]["while"]) + '\n'
        output += '\t branching: ' + str(self.props["illegal"]["branching"]) + '\n'
        output += '\t nested loops: ' + str(self.props["illegal"]["nested"]) + '\n'
        output += '\t recursion: ' + str(self.props["illegal"]["recursion"]) + '\n'
        output += '\t classes: ' + str(self.props["illegal"]["classes"]) + '\n'
        output += '\t functions: ' + str(self.props["illegal"]["functions"]) + '\n'
        output += 'solutions: \n'
        print(output)
        for sol in self.props["solutions"]:
            sol.printProgram()

def verify(lecturerIn):
    """Verifies the consistency of the lecturer inputs.

    Makes a call to verification.py, which determines if the lecturer input contains any inconsistencies.

    Parameters
    ----------
    lecturerIn : dict
        A dictionary that summarises the specifications associated with an exercise.
    """
    out = VERIFY.inputData().getInput(lecturerIn)
    VERIFY.formatVerification(out)
    return out['containsConflicts']

# ------------------------------------ PRELIMINARY FEEDBACK: HELPER CODE ------------------------------------ #
class blockType(enum.Enum):
    """Class used to check if logical programming structures are contained in a code segment.

    Attributes
    ----------
    codeSegment : str
        A segment of Python code

    Methods
    -------
    getType(codeSegment)
        Returns the block type associated with an object.
    """
    FOR = 0
    WHILE = 1
    RETURN = 2
    BASIC = 3
    IF = 4
    ELIF = 5
    ELSE = 6
    DEF = 7

    def getType(codeSegment):
        """Returns the CFG block type associated with a piece of code."""
        if bool(re.search("(\n|^)for(.)*:$", codeSegment)):
            return blockType.FOR
        elif bool(re.search("(\n|^)while(.)*:$", codeSegment)):
            return blockType.WHILE
        elif bool(re.search("(\n|^)if(.)*:$", codeSegment)):
            return blockType.IF
        elif bool(re.search("(\n|^)elif(.)*:$", codeSegment)):
            return blockType.ELIF
        elif bool(re.search("(\n|^)else(.)*:$", codeSegment)):
            return blockType.ELSE
        elif bool(re.search("(\n|^)return(.)+", codeSegment)):
            return blockType.RETURN
        elif bool(re.search("(\n|^)def (.)+\((.)*\):", codeSegment)):
            return blockType.DEF
        else:
            return blockType.BASIC

def yaml2dict(yam):
    """Converts the input .yaml file to an equivalent python dictionary

    Parameters
    ----------
    yam : str
        The name of the yaml file containing the lecturer inputs
    """
    dictionary = {'imports': [], 'calls': [], 'operators': [], 'required': {}, 'illegal': {}, 'timeout': 2, 'epsilon': 0, 'solutions': [], 'test cases': {}}
    TUP = False
    with open(yam) as f:
        docs = yaml.load(f, Loader=yaml.FullLoader)
        for k, v in docs.items():
            if k == 'timeout' and v is not None: dictionary['timeout'] = v
            if k == 'epsilon' and v is not None: 
                dictionary['epsilon'] = v
            if k == 'problem':
                dictionary["problem"] = v
            elif k == 'imports' and v is not None:
                dictionary["imports"] = v
            elif k == 'calls' and v is not None:
                dictionary["calls"] = v
            elif k == 'operators' and v is not None:
                dictionary["operators"] = v
            elif k == 'tuple' and v is not None and v == 'X':
                TUP = True
            elif k == 'required':
                dictionary['required'] = {'for': False, 'while': False, 'branching': False, 'nested': False, 'recursion': False, 'classes': False}
                if v[0]["for"] == 'X':
                    dictionary["required"]["for"] = True
                if v[1]["while"] == 'X':
                    dictionary["required"]["while"] = True
                if v[2]["branching"] == 'X':
                    dictionary["required"]["branching"] = True
                if v[3]["recursion"] == 'X':
                    dictionary["required"]["recursion"] = True
                if v[4]["nested loops"] == 'X':
                    dictionary["required"]["nested"] = True
                if v[5]["classes"] == 'X':
                    dictionary["required"]["classes"] = True
            elif k == 'illegal':
                dictionary['illegal'] = {'for': False, 'while': False, 'branching': False, 'nested': False, 'recursion': False, 'classes': False}
                if v[0]["for"] == 'X':
                    dictionary["illegal"]["for"] = True
                if v[1]["while"] == 'X':
                    dictionary["illegal"]["while"] = True
                if v[2]["branching"] == 'X':
                    dictionary["illegal"]["branching"] = True
                if v[3]["recursion"] == 'X':
                    dictionary["illegal"]["recursion"] = True
                if v[4]["nested loops"] == 'X':
                    dictionary["illegal"]["nested"] = True
                if v[5]["classes"] == 'X':
                    dictionary["illegal"]["classes"] = True
                if v[6]["functions"] == 'X':
                    dictionary["illegal"]["functions"] = True
            elif k == 'solutions':
                dictionary['solutions'] = v
            elif k == 'test cases':
                dictionary["test cases"] = v
    if TUP:
        for case in dictionary['test cases']:
            case['in'] = tuple(case['in'])
    return dictionary

# checks whether the student has made use of illegal imports
def checkImports(source: inputData, code: program):
    """Checks whether the student has made use of illegal imports

    Parameters
    ----------
    source : inputData
        inputData object associated with problem specifications
    code : program
        Program object associated with a student submission
    """
    illegalImps = []
    for imp in code.props["imports"]:
        if imp in source["imports"]:
            illegalImps.append(imp)
    if TERMINAL:
        if len(illegalImps) > 0:
            return '\033[33mWarning:\033[m You are not allowed to make use of these imports: ' + str(illegalImps) + '.'
        else:
            return 'Imports \033[32mverified\033[m: All imports used are legal'
    else: 
        if len(illegalImps) > 0:
            return 'Warning: You are not allowed to make use of these imports: ' + str(illegalImps) + '.'
        return
        

# TODO: check number of input parameters here
def checkType(code: program):
    """Checks that the function returns something if required.

    Parameters
    ----------
    code : program
        The dictionary of properties associated with a student submission
    """
    ret = ''
    if TERMINAL:
        if len(code.props["functions"]) == 0:
            ret += '\033[33mWarning:\033[m This problem requires that you submit a function. You have submitted a program.'
        elif not code.props["functions"][0].props["return"]:
            ret += '\033[33mWarning:\033[m Your function does not return anything. Make sure that your function includes a return statement.'
        if ret == '':
            return 'Submission type \033[32mverified\033[m: The submission is of the correct format.'
        else:
            return ret
    else:
        if len(code.props["functions"]) == 0:
            ret += 'Warning: This problem requires that you submit a function. You have submitted a program.'
        elif not code.props["functions"][0].props["return"]:
            ret += 'Warning: Your function does not return anything. Make sure that your function includes a return statement.'
        if ret == '': ret = 'verified'
        return ret

def checkRequired(source: inputData, code: program):
    """Checks that the solution contains the required concepts.

    Parameters
    ----------
    source : inputData
        The inputData information associated with the exercises specifications
    code : program
        The program object associated with the student submission
    """
    requirements = source["required"]
    ret = ''
    for func in code.props["functions"]:
        submission = func.props
        if requirements["for"] and not submission["for"]:
            err = 'Your solution to this problem \033[31mMUST\033[m make use of a for loop.\n'
            if err not in ret: ret += err
        if requirements["while"] and not submission["while"]:
            err ='Your solution to this problem \033[31mMUST\033[m  make use of a while loop.\n'
            if err not in ret: ret += err
        if requirements["branching"] and not submission["branching"]:
            err = 'Your solution to this problem \033[31mMUST\033[m make use of an if/elif/else statement.\n'
            if err not in ret: ret += err
        if requirements["recursion"] and not submission["recursion"]:
            err = 'Your solution to this problem \033[31mMUST\033[m make use of recursion.\n'
            if err not in ret: ret += err
        if requirements["nested"] and not submission["nestedLoop"]:
            err = 'You \033[31mMUST\033[m  make use of nested loops in your solution.\n'
            if err not in ret: ret += err
    if TERMINAL:
        if ret == '':
            return 'Submission requirements \033[32mverified\033[m.'
        else:
            return 'The submission failed to meet some requirements: \n' + ret
    else:
        if ret != '':
            return removeFormatting(ret)
        return

def checkIllegal(source: inputData, code: program):
    """Checks that the solution does not contain any illegal concepts

    Parameters
    ----------
    source : inputData
        The inputData information associated with the exercises specifications
    code : program
        The program object associated with the student submission
    """
    illegal = source["illegal"]
    ret = ''
    for func in code.props["functions"]:
        submission = func.props
        if illegal["for"] and submission["for"]:
            err = '\nYour solution to this problem \033[31mMUST NOT\033[m make use of a for loop.'
            if err not in ret: ret += err
        if illegal["while"] and submission["while"]:
            err = '\nYour solution to this problem \033[31mMUST NOT\033[m make use of a while loop.'
            if err not in ret: ret += err
        if illegal["branching"] and submission["branching"]:
            err = '\nYour solution to this problem \033[31mMUST NOT\033[m make use of an if/elif/else statement.'
            if err not in ret: ret += err
        if illegal["recursion"] and submission["recursion"]:
            err = '\nYour solution to this problem \033[31mMUST NOT\033[m make use of recursion.'
            if err not in ret: ret += err
        if illegal["nested"] and submission["nestedLoop"]:
            err = '\nYou \033[31mMUST NOT\033[m make use of nested loops in your solution.'
            if err not in ret: ret += err
    if TERMINAL:
        if ret == '':
            return 'No illegal concepts \033[32mverified\033[m.'
        else:
            return '\033[33mWarning\033[m:The submission contains concepts that are not allowed in this exercise: ' + ret
    else:
        if ret != '':
            return removeFormatting(ret)
        return

def checkCalls(source: inputData, code: program):
    """Checks that a student submission does not make use of any prohibited calls

    Parameters
    ----------
    source : inputData
        The inputData information associated with the exercises specifications
    code : program
        The program object associated with the student submission
    """
    ret = []
    if source["calls"] is not None:
        for call in source["calls"]:
            for func in code.props["functions"]:
                if call in func.props["calls"]:
                    if call not in ret:
                        ret.append(call)
    if TERMINAL:
        if len(ret) == 0:
            return 'Submission does not make use of any prohibited calls: \033[32mverified\033[m.'
        else:
            return '\033[33mWarning\033[m: This submission makes use of the following prohibited calls: ' + str(ret)
    else:
        if len(ret) != 0:
            return 'Warning: This submission makes use of the following prohibited calls: ' + str(ret)
        return

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
    if TERMINAL:
        if len(ret) == 0:
            return 'Submission does not make use of any prohibited operators: \033[32mverified\033[m.\n'
        else:
            return '\033[33mWarming\033[m: This submission makes use of prohibited operators: ' + str(ret) + '\n'
    else:
        if len(ret) != 0:
            return 'Warming: This submission makes use of prohibited operators: ' + str(ret)
        return

def isCorrect(out, exp, epsilon):
    """Helper function: used to compare test case outputs with expected outputs."""
    if type(exp) is float and type(out) is float:
        return abs(out - exp) < epsilon
    else:
        return out == exp

def getRuntimeError(e, line):
    """Translates a runtime error into a suggestion of the likely cause of the error

    Parameters
    ----------
    e : Exception
        The exception object produced during testing
    line : int
        The line number on which the error occurred
    """
    if e.__class__ == TypeError:
        return '\033[31mTypeError:\033[m You have attempted an operation or instruction that is invalid for a specific data type on line ' + str(line)
    elif e.__class__ == StopIteration:
        return '\033[31mStopIteration:\033[m It looks like you are trying to access the next() item in an iterator when there are no more next() items on line ' + str(line)
    elif e.__class__ == OverflowError:
        return '\033[31mOverflowError:\033[m One of your calculations has exceeded the maximum limit for the numeric type on line ' + str(line)
    elif e.__class__ == FloatingPointError:
        return '\033[31mFloatingPointError:\033[m A floating point calculation in your program has failed on line ' + str(line)
    elif e.__class__ == ZeroDivisionError:
        return '\033[31mZeroDivisionError:\033[m You have attempted to divide by 0 or use the modulo operator on 0 on line ' + str(line)
    elif e.__class__ == AttributeError:
        return '\033[31mAttributeError:\033[m You have tried to access or assign a property of a variable that does not exist on line ' + str(line)
    elif e.__class__ == EOFError:
        return '\033[31mEOFError:\033[m You have a raw_input() or input() function that is not receiving any input on line ' + str(line)
    elif e.__class__ == ImportError:
        return '\033[31mImportError:\033[m An import statement in your program has failed on line ' + str(line)
    elif e.__class__== IndexError:
        return '\033[31mIndexError:\033[m The index could not be found on line ' + str(line)
    elif e.__class__ == KeyError:
        return '\033[31mKeyError:\033[m You have tried to use a dictionary key that could not be found on line ' + str(line)
    elif e.__class__ == NameError:
        return '\033[31mNameError:\033[m It looks like you have tried to access a variable or function that was not declared on line ' + str(line)
    elif e.__class__ == UnboundLocalError:
        return '\033[31mUnboundLocalError:\033[m You are trying to access a local variable that does not have any value assigned to it on line ' + str(line)
    elif e.__class__ == EnvironmentError:
        return '\033[31mEnvironmentError:\033[m An exception has occurred outside the Python environment on line ' + str(line)
    elif e.__class__ == IOError:
        return '\033[31mIOError:\033[m An input or output operation has failed on line ' + str(line)
    elif e.__class__ == OSError:
        return '\033[31mOSError:\033[m An operating system error has occured on line ' + str(line)
    elif e.__class__ == SyntaxError:
        return '\033[31mSyntaxError:\033[m There is a mistake in your Python syntax on line ' + str(line)
    elif e.__class__ == IndentationError:
        return '\033[31mIndentationError:\033[m There is a mistake in your indentations on line ' + str(line)
    elif e.__class__ == SystemError:
        return '\033[31mSystemError:\033[m The Python Interpreter has encountered an internal problem on line ' + str(line)
    elif e.__class__ == ValueError:
        return '\033[31mValueError:\033[m You have specified invalid values for arguments on line ' + str(line)
    elif e.__class__ == RuntimeError:
        return '\033[31mRuntimeError:\033[m Your program has encountered a runtime error on line ' + str(line)
    elif e.__class__ == NotImplementedError:
        return '\033[31mNotImplementedError:\033[m You have not implemented an abstract method in an inherited class on line ' + str(line)
    else:
        return '\033[31mError:\033[m Your program contains one or more errors on line ' + str(line)

# ------------------------------------ COMMON: HELPER CODE ------------------------------------ #
def fCommon(data: program):
    """Identifies which program properties are shared by all of the sample solutions to a problem.

    Returns a dictionary of common program properties
    
    Parameters
    ----------
    data : program
        The program object associated with ALL of the solutions to a programming problem
    """
    common = {
        "subs": len(data["solutions"]),
        "recursive": 0,
        "branching": 0,
        "loop": 0,
        "recursion": 0,
        "return": 0,
        "nested": 0,
        "calls": 0,
        "params": [],
        "multiFunc": False
    }
    for solution in data["solutions"]:
        if len(solution.props["functions"]) > 1:
            common["multiFunc"] = True
        for func in solution.props["functions"]:
            # check that num params matches for all
            if func.props["return"]:
                common["return"] += 1
            if func.props["recursive"]:
                common["recursive"] += 1
            if func.props["branching"]:
                common["branching"] += 1
            if func.props["for"] or func.props["while"]:
                common["loop"] += 1
            if func.props["recursion"]:
                common["recursion"] += 1
            if func.props["nestedLoop"]:
                common["nested"] += 1
            if len(func.props["calls"]) > 0:
                common["calls"] += 1
            common["params"].append(func.props["params"])
    return common

def fDynamicFeedback(sub: functions, common):
    """Uses the common dictionary to provide dynamic feedback on the structure of a student submission, where the required submission is a function

    Parameters
    ----------
    sub : functions
        The function object associated with a student submission
    common : dict
        The dictionary of logical structures shared by all the known solutions to a problem.
    """
    ret = ''
    if common["branching"] == common["subs"] and not sub.props["branching"]:
        ret += 'Have you tried using an if/elif/else statement to solve this problem?\n'
    if common["recursive"] == common["subs"] and not sub.props["recursive"]:
        if common["loop"] > 0 and common["recursion"] > 0:
            ret += 'Have you tried using loops or recursion to solve this problem?\n'
        elif common["loop"] > 0:
            ret += 'Have you tried using for or while loops to solve this problem?\n'
        elif common["recursion"] > 0:
            ret += 'This problem requires the use of recursion.\n'
    if common.get('nested') == common["subs"] and not sub.props.get('nested'):
        ret += 'It looks like you need to use nested loops to solve this problem.\n'
    # check the consistency of params
    if len(common["params"]) > 0:
        p = common["params"][0]
        cnt = 0
        for param in common["params"]:
            if param == p:
                cnt += 1
        if (cnt == len(common["params"])) and p != sub.props["params"]:
            ret += 'Your function should take in ' + str(p) + ' argument(s), but it takes ' + str(sub.props["params"]) + ' argument(s).\n'
    if common["return"] == common["subs"] and not sub.props["return"]:
        ret += 'Your function needs to return something.\n'
    # check for missing base cases in recursion
    if sub.props["recursion"] and not sub.props["base"]:
        ret += 'Remember: When you implement recursion, you need to include a base case.\n'
    return ret

def flag(solution, myYaml):
    """Triggers a simulation of the flagging process

    Called when a student's solution appears to be correct, but does not match the structure of the sample solutions.
    If the lecturer approves the solution, it is added to the bank oof known solutions

    Parameters
    ----------
    solution : str
        The filename of the student submission
    myYaml : str
        The file name of the .yaml lecturer specifications
    """
    command = 'gnome-terminal -- python3 ~/22547134-WHK1-src/feedback/flag.py ' + solution + ' ' + myYaml
    os.system(command)

def commonTest(filename, yamlName, lecturer, student, web, epsilon, timeout):
    """Run the testcases and collect outputs (for the common hint generation approach)
    
    Parameters
    ----------
    filename : str
        The name of the .py file submitted by the student
    yamlName : str
        The name of the .yaml file containing the lecturer specifications
    lecturer : inputData
        The inputData object associated with the problem specifications
    student : program
        The program object associated with a student submission
    web : dict
        The dictionary containing outputs, returned to the web-server when feedback generation is being used in conjunction with the web-interface
    epsilon : float
        A value used to specify an allowable error when the student program returns a float
    timeout : int
        An allowable time (in seconds) that functions are given to run, before it is assumed that they contain infinite loops 
    """
    name = re.search('(\w)+.py$', filename).group()
    name = re.sub('.py', "", name)
    try:
        if name in sys.modules:  
            del sys.modules[name]
        with StringIO() as trash, redirect_stdout(trash):
            problem = importlib.import_module(name)
    except Exception as e:
        inc('compile')
        exc_type, exc_value, exc_traceback = sys.exc_info()
        if e.__class__ == SyntaxError:
            if TERMINAL: print(f'You have a \33[31mSyntaxError\33[m that starts on line {e.lineno} at character position {e.offset}.')
            else: web['errors'] = 'You have a syntax error that starts on line ' + str(e.lineno) + ' at character position ' + str(e.offset)  + '.'
        if TERMINAL: print(f'\33[31mSubmission failed to compile:\33[m {exc_type} -> {exc_value}')
        else: web['compile'] = 'Submission failed to compile: ' + str(exc_type) + ' -> ' + str(exc_value)
        return web
    bestFunc = {"output": {}, "score": 0, "dFeedback": '', "sFeedback": ''}
    availableFunctions = []
    dynamicFeedback = ''
    structuralFeedback = ''
    for a in dir(problem):
        if isinstance(getattr(problem, a), types.FunctionType):
            availableFunctions.append(a)
    for func in availableFunctions:
        # build a 'common' dictionary for feedback
        # this dictionary finds similarities between the sample solutions in order to indentify trends in the structure of a program
        common = fCommon(lecturer.props)
        if DEBUG: print(f'common: {common}')
        # handle submissions that contain more than 1 function
        if not common["multiFunc"] and len(student.props["functions"]) > 1:
            # provide feedback on the function that passes the most test cases
            err = 'It looks like you have written more than 1 function. Can you solve this problem using only 1 function?\n'
            if err not in structuralFeedback:
                structuralFeedback += err
        else:
            # only have to provide feedback on a single function
            dynamicFeedback += fDynamicFeedback(student.props["functions"][0], common)

        myFunction = getattr(problem, func)
        passed = 0
        caseNo = 1
        functionProperties = getFunc(student, func)
        output = {'Feedback': []}
        feedback = ''
        feedback2 = ''
        for case in lecturer.props["test cases"]:
            output[caseNo] = {'Pass': False, 'Feedback': '', 'Errors':'', 'stdOut': '', 'stdErr': ''}
            try: 
                if common["params"][0] == functionProperties["params"]:
                    with StringIO() as buf, redirect_stdout(buf):
                        if type(case['in']) == tuple: out = func_timeout(timeout, myFunction, case["in"])
                        else: out = func_timeout(timeout, myFunction, [case["in"]])
                        output[caseNo]['stdOut'] += buf.getvalue()
                    if isCorrect(out, case["out"], epsilon):
                        output[caseNo]['Pass'] = True
                        output[caseNo]['Feedback'] = func + '(' + str(case["in"]) + ') -> ' + str(case["out"])
                        passed = passed + 1
                    else:
                        if type(case["out"]) != type(out):
                            exp = re.search('\'(.)+\'', str(type(case["out"]))).group()
                            got = re.search('\'(.)+\'', str(type(out))).group()
                            output[caseNo]['Feedback'] = 'Your function should return a ' + exp + ' but it returns a ' + got + ' instead.\n'
                            fb = 'Your function should return a ' + exp + ' but it returns a ' + got + ' instead.\n'
                            if fb not in feedback2: feedback2 += fb
                        output[caseNo]['Feedback'] = 'Expected ' + str(case["out"]) + ', but got ' + str(out) + '\n'
                else:
                    output['Feedback'].append('Could not test function: incorrect number of function parameters.\n')
            except FunctionTimedOut:
                output[caseNo]['Errors'] = func + ' timed out.\n'
                fb = 'Hmm... This submission is timing out. Are you sure you don\'t have infinite loops?\n'
                if fb not in feedback2: feedback2 += fb
            except Exception as e:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                line = traceback.extract_tb(exc_traceback)[3].lineno
                tb_list = traceback.extract_tb(exc_traceback)
                tb_list.remove(tb_list[0])
                tb_list = traceback.format_list(tb_list)
                stdError = ''.join(tb_list)
                stdError += str(exc_type.__name__) + ': ' + str(e)
                output[caseNo]['stdErr'] = stdError
                if TERMINAL: output[caseNo]['Feedback'] = getRuntimeError(e, line) + ' -> ' + str(exc_value) + '\n'
                else: output[caseNo]['Feedback'] = removeFormatting(getRuntimeError(e, line) + ' -> ' + str(exc_value))
            caseNo += 1
        if bestFunc["score"] <= passed:
            bestFunc["output"] = output
            bestFunc["score"] = passed
            bestFunc["dFeedback"] = feedback
            bestFunc['sFeedback'] = feedback2
    if TERMINAL: printOutput(bestFunc["output"])
    else: 
        bestFunc["output"].pop('Feedback')
        web['tests'] = bestFunc["output"]
    dynamicFeedback += bestFunc["dFeedback"]
    structuralFeedback += bestFunc["sFeedback"]
    if bestFunc["score"] != len(lecturer.props["test cases"]):
        if dynamicFeedback == '': inc('no hint')
        else: inc('hint')
        # provide dynamic feedback
        # dynamic feedback - obtained by comparing the structure of known solutions to the structure of the submission
        if TERMINAL:
            print(structuralFeedback)
            if dynamicFeedback != '': print(f'{filename}: \033[34mHINTS:\033[m {dynamicFeedback}')
            print(f'It looks like your solution needs some work. Use the feedback that you have received to make some changes.\n')
        else:
            web['feedback'] = dynamicFeedback
    else:
        inc('na')
        # check that code matches input, if not, flag for moderation and provide feedback
        if dynamicFeedback == '':
            if TERMINAL: 
                print('Well Done! You have passed all of the test cases and the structure of your submission matches the sample solutions\n')
        else:
            if TERMINAL:
                flag(filename, yamlName)
                print(f'Your submission passed all of the test cases, but doesn\'t match the sample solutions. It has been flagged for moderation.\n')
                print(dynamicFeedback)
            else:
                web['flag'] = True
    return web

# ------------------------------------ WEIGHTED: HELPER CODE ------------------------------------ #
def solutionGraph(solutions):
    """Takes in a list of solutions and returns the list of graphs contained in the combined weighted graph.

    A graph is represented by a list of nodes.
    
    Parameters
    ----------
    solutions : list
        A list of the possible solutions to the programming exercise
    """
    graphs = []
    cfgs = []
    for source in solutions:
        parser = CFG.PyParser(source)
        parser.removeCommentsAndDocstrings()
        parser.formatCode()
        cfg = CFG.CFGVisitor().build('sample', ast.parse(parser.script))
        cfgs.append(cfg)
        graphDictionary = cfg.get()
        nodeList = CFG.callIterate(graphDictionary)
        graphExists = False
        for graph in graphs:
            if CFG.isomorphic(graph, nodeList):
                graphExists = True
        if not graphExists:
            graphs.append(nodeList)
    return graphs

def combine(graphs):
    """Takes in the list of graphs contained in the combined weighted graph and returns the combined weighted graph
    
    Parameters
    ----------
    graphs : list
        A list of graphs derived from the solutions to a programming assignment
    """
    # generate a single structure graph from all the input files
    mainGraph = None
    for graph in graphs:
        if mainGraph is None:
            mainGraph = copy.deepcopy(graph)
            src = CFG.getNode(0, mainGraph)
        else:
            for n in graph:
                if n.type != 'source':
                    mainGraph.append(n)
                else:
                    for nxt in n.next:
                        src.next.append(nxt)
    edges = CFG.getEdges(mainGraph)
    for edge in edges:
        edge.addWeight(1)
    return (mainGraph, edges)

def getGraph(filename):
    """Returns the structural graph of a student submission
    
    Parameters
    ----------
    filename : str
        The name of the .py file containing the student submission to the programming exercise
    """
    try:
        source = open(filename, 'r').read()
        compile(source, filename, 'exec')
        parser = CFG.PyParser(source)
        cfg = CFG.CFGVisitor().build(filename, ast.parse(parser.script))
        graphDictionary = cfg.get()
        nodeList = CFG.callIterate(graphDictionary)
        return nodeList
    except:
        return None

def runTests(filename, lecturer, web, epsilon, timeout):
    """Runs the prescribed test cases on the student submission
    
    Returns the number of test cases passed or -1 if testing failed

    Parameters
    ----------
    filename : str
        The name of the .py file containing the student submission to the programming exercise
    lecturer : inputData
        The inputData object associated with the specifications of the programming exercise
    web : dict
        The dictionary containing outputs, returned to the web-server when feedback generation is being used in conjunction with the web-interface
    epsilon : float
        A value used to specify an allowable error when the student program returns a float
    timeout : int
        An allowable time (in seconds) that functions are given to run, before it is assumed that they contain infinite loops 
    """
    output = {'Feedback': []}
    Err = False
    name = re.search('(\w)+.py$', filename).group()
    name = re.sub('.py', "", name)
    try:
        source = open(filename, 'r').read()
        compile(source, filename, 'exec')
        if name in sys.modules:  
            del sys.modules[name]
        with StringIO() as trash, redirect_stdout(trash):
            problem = importlib.import_module(name)
    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        if e.__class__ == SyntaxError:
            if TERMINAL: print(f'You have a \33[31mSyntaxError\33[m that starts on line {e.lineno} at character position {e.offset}.')
            else: web['errors'] = 'You have a syntax error that starts on line ' + str(e.lineno) + ' at character position ' + str(e.offset)  + '.'
        if TERMINAL: print(f'\33[31mSubmission failed to compile:\33[m {exc_type} -> {exc_value}')
        else: web['compile'] = 'Submission failed to compile: ' + str(exc_type) + ' -> ' + str(exc_value)
        return -1
    parser = CFG.PyParser(source)
    cfg = CFG.CFGVisitor().build(filename, ast.parse(parser.script))
    programData = program()
    try:
        cfg.getData(False, programData)
    except:
        if TERMINAL: print(f'\33[31mError:\33 Program does not compile correctly')
        else: web['errors'] += 'Program does not compile correctly.\n'
        return -1
    availableFunctions = []
    for a in dir(problem):
        if isinstance(getattr(problem, a), types.FunctionType):
            availableFunctions.append(a)
    for func in availableFunctions:
        if len(availableFunctions) != 1:
            if len(availableFunctions) == 0:
                if TERMINAL: print(f'\33[31mError:\33[m You need to write your program in the form of a function.')
                else: web['errors'] += 'You need to write your program in the form of a function.\n'
            else: 
                if TERMINAL: print(f'\33[31mError:\33[m Solve this problem using a single function')
                else: web['errors'] += 'Solve this problem using a single function.\n'
            return -1
        myFunction = getattr(problem, func)
        passed = 0
        caseNo = 1
        functionProperties = getFunc(programData, func)
        for case in lecturer["test cases"]:
            output[caseNo] = {'Pass': False, 'Feedback': '', 'Errors':'', 'stdOut': '', 'stdErr': ''}
            try: 
                if type(case["in"]) is tuple:
                    inputs = []
                    for entry in case["in"]:
                        inputs.append(entry)
                else:
                    inputs = [case["in"]]
                if len(inputs) == functionProperties["params"]:
                    with StringIO() as buf, redirect_stdout(buf):
                        if type(case['in']) == tuple: out = func_timeout(timeout, myFunction, case["in"])
                        else: out = func_timeout(timeout, myFunction, [case["in"]])
                        output[caseNo]['stdOut'] += buf.getvalue()
                    if isCorrect(out, case["out"], epsilon):
                        output[caseNo]['Pass'] = True
                        output[caseNo]['Feedback'] = func + '(' + str(case["in"]) + ') -> ' + str(case["out"])
                        passed = passed + 1
                    else:
                        if type(case["out"]) != type(out):
                            exp = re.search('\'(.)+\'', str(type(case["out"]))).group()
                            got = re.search('\'(.)+\'', str(type(out))).group()
                            output[caseNo]['Feedback'] = 'Your function should return a ' + exp + ' but it returns a ' + got + ' instead.\n'
                            Err = True
                        output[caseNo]['Feedback'] = 'Expected ' + str(case["out"]) + ', but got ' + str(out) + '\n'
                else:
                    output[caseNo]['Feedback'] += 'Could not test function: incorrect number of function parameters.\n'
                    Err = True
            except FunctionTimedOut:
                output[caseNo]['Feedback'] = 'Hmm... This submission is timing out. Are you sure you don\'t have infinite loops?\n'
            except Exception as e:
                Err = True
                exc_type, exc_value, exc_traceback = sys.exc_info()
                tb_list = traceback.extract_tb(exc_traceback)
                tb_list.remove(tb_list[0])
                tb_list = traceback.format_list(tb_list)
                stdError = ''.join(tb_list)
                stdError += str(exc_type.__name__) + ': ' + str(e)
                output[caseNo]['stdErr'] = stdError
                line = traceback.extract_tb(exc_traceback)[3].lineno
                if TERMINAL: output[caseNo]['Feedback'] = getRuntimeError(e, line) + ' -> ' + str(exc_value) + '\n'
                else: output[caseNo]['Feedback'] = removeFormatting(getRuntimeError(e, line) + ' -> ' + str(exc_value))
            caseNo += 1
    if TERMINAL: printOutput(output)
    else: web['tests'] = output
    if Err: return -1
    return passed

def checkRequirements(filename, lecturer):
    """Returns true if the solution meets requirements and false otherwise
    
    Parameters
    ----------
    filename : str
        The name of the .py file containing the student submission to the programming exercise
    lecturer : inputData
        The inputData object associated with the specifications of the programming exercise
    """
    ret = True
    try:
        source = open(filename, 'r').read()
        compile(source, filename, 'exec')
    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        if e.__class__ == SyntaxError:
            print(f'You have a \33[31mSyntaxError\33[m that starts on line {e.lineno} at character position {e.offset}.')
        print(f'\033[31mSubmission failed to compile:\033[m {exc_type} -> {exc_value}')
        exit(1)
    parser = CFG.PyParser(source)
    cfg = CFG.CFGVisitor().build(filename, ast.parse(parser.script))
    programData = program()
    try:
        cfg.getData(False, programData)
    except:
        return -1

    # check imports
    for imp in programData.props["imports"]:
        if imp in lecturer["imports"]: 
            ret = False

    # check required concepts
    requirements = lecturer["required"]
    for func in programData.props["functions"]:
        submission = func.props
        if requirements["for"] and not submission["for"]:
            ret = False
        if requirements["while"] and not submission["while"]:
            ret = False
        if requirements["branching"] and not submission["branching"]:
            ret = False
        if requirements["recursion"] and not submission["recursion"]:
            ret = False
        if requirements["nested"] and not submission["nestedLoop"]:
            ret = False

    # check illegal concepts
    illegal = lecturer["illegal"]
    for func in programData.props["functions"]:
        submission = func.props
        if illegal["for"] and submission["for"]:
            ret = False
        if illegal["while"] and submission["while"]:
            ret = False
        if illegal["branching"] and submission["branching"]:
            ret = False
        if illegal["recursion"] and submission["recursion"]:
            ret = False
        if illegal["nested"] and submission["nestedLoop"]:
            ret = False
    
    # check for prohibited calls
    if lecturer["calls"] is not None:
        for call in lecturer["calls"]:
            for func in programData.props["functions"]:
                if call in func.props["calls"]:
                    ret = False
    
    # check for return statement
    ct = checkType(programData)
    if 'verified' not in ct: return -1

    # check for illegal operators
    operatorMappping = {'and': 'And','or': 'Or','+': 'Add','-': 'Sub','*': 'Mult','@': 'MatMult','/': 'Div','%': 'Mod','**': 'Pow',
        '<<': 'LShift','>>': 'RShift','|': 'BitOr','^':'BitXor','&': 'BitAnd','//': 'FloorDiv','~': 'Invert','!': 'Not','+': 'UAdd','-': 'USub',
        '==': 'Eq','!=': 'NotEq','<': 'Lt','<=': 'LtE','>': 'Gt','>=': 'GtE','is': 'Is','is not': 'IsNot','in': 'In','not in': 'NotIn'
    }
    code = ast.parse(source)
    astSummary = ast.dump(code)
    for operator in lecturer["operators"]:
        opString = 'op=' + operatorMappping[operator] + '()'
        if opString in astSummary:
            ret = False
    return ret

def convert(matches, node):
    """Returns the item paired with <node> in an isomorhpic mapping."""
    for item in matches:
        if item[1] == node:
            return item[0]

def initialiseWeighted(lecturer):
    """Create the initial pickled graph objects
    
    Parameters
    ----------
    lecturer : inputData
        The inputData object associated with the specifications of the programming exercise
    """
    # step 1: get the solutions and their graphs
    graphs = solutionGraph(lecturer["solutions"])
    # step 2: compile the solutions into a single graph
    graphObj = combine(graphs)
    with open('graphs.object', 'wb') as graph_file:
        pickle.dump([graphs, graphObj], graph_file)

def weightedTest(lecturer, filename, web, epsilon, timeout):
    """Driver code: for testing student programs using the weighted solution graph for hint generation
    
    Parameters
    ----------
    lecturer : inputData
        The inputData object associated with the specifications of the programming exercise
    filename : str
        The name of the .py file containing the student submission to the programming exercise
    web : dict
        The dictionary containing outputs, returned to the web-server when feedback generation is being used in conjunction with the web-interface
    epsilon : float
        A value used to specify an allowable error when the student program returns a float
    timeout : int
        An allowable time (in seconds) that functions are given to run, before it is assumed that they contain infinite loops 
    """
    # accessing the pickled graph objects
    with open('graphs.object', 'rb') as graph_file:
        graph = pickle.load(graph_file)
    graphObj = graph[1]
    graphs = graph[0]

    # step 3: generate the graph for the student solution
    studentGraph = getGraph(filename)
    if studentGraph is not None:
        
        # step 4: compare the student graph to the solution graph
        legal = checkRequirements(filename, lecturer)
        if legal == -1:
            inc('instruct')
            if TERMINAL: print(f'{filename} \033[33mThis solution is not valid.\033[m')
            else: web['feedback'] += 'This solution is not valid.\n'
            return web
        passes = runTests(filename, lecturer, web, epsilon, timeout)

        isomorphic = False
        for graph in graphs:
            if CFG.isomorphic(graph, studentGraph):
                isomorphic = True

        # a: if the student graph is INVALID, provide feedback
        if not legal:
                if TERMINAL: print(f'{filename} \033[33mThis solution is not valid.\033[m')
                else: web['feedback'] += 'This solution is not valid.\n'
        elif passes != len(lecturer["test cases"]):
            if passes == -1:
                inc('runtime')
                if TERMINAL: print(f'{filename} \033[36mNo hints could be generated due to errors in the submission\033[m')
                else: web['feedback'] += 'No hints could be generated due to errors in the submission.\n'
            else:
                # get graph similarity
                if isomorphic:
                    inc('no hint')
                    if TERMINAL: print(f'{filename} \033[35mNo structural differences identified\033[m')
                    else: web['feedback'] += 'No structural differences identified.\n'
                else:
                    inc('hint')            
                    hint = CFG.getHint(graphObj[0], graphObj[1], studentGraph)
                    print(f'{filename} \033[34mHINTS:\033[m')
                    if TERMINAL: print(hint)
                    else: web['feedback'] += hint

        # b: if the student graph is VALID and is NOT in the solution graph - add it
        elif passes == len(lecturer["test cases"]) and legal and not isomorphic:
            inc('na')
            graphs.append(studentGraph)
            print(f'{filename} \33[32mpasses all cases -> added to graph\33[m')
            src = CFG.getNode(0, graphObj[0])
            for n in studentGraph:
                if n.type != 'source':
                    graphObj[0].append(n)
                else:
                    for nxt in n.next:
                        src.next.append(nxt)
            edges = CFG.getEdges(studentGraph)
            for edge in edges:
                edge.addWeight(1)
                graphObj[1].append(edge)

        # c: if the student graph is VALID and is IN the solution graph - weight edges accordingly
        # suggestion from Willem - every time you weight a solution NOT in the original solutions, also increase the weights of the original solutions by 1 (not yet implemented)
        else:
            inc('na')
            print(f'{filename} \33[32mpasses all cases -> graph weighted accordingly\33[m')
            for graph in graphs:
                matches = CFG.getMatching(graph, studentGraph)
                if matches is not None: break
            edges = []
            for node in studentGraph:
                for nxt in node.next:
                    edges.append((convert(matches, node.id), convert(matches, nxt.id)))
            for edge in graphObj[1]:
                edgeObj = (edge.start, edge.end)
                if edgeObj in edges:
                    edge.addWeight(1)

        # pickling the graph object for later access
        with open('graphs.object', 'wb') as graph_file:
            pickle.dump([graphs, graphObj], graph_file)

    else:
        print(f'{filename} \033[31mSubmission does not compile\033[m')
        inc('compile')
    return web

# ------------------------------------ DRIVER CODE ------------------------------------ #
def webTests(input, student):
    """Driver code: for testing student programs agaist lecturer specifications, and generating hints
    
    Parameters
    ----------
    input : dict
        The dictionary of problem specifications supplied by the lecturer
    student : str
        The name of the .py file containing the student submission to the programming exercise
    """
    if input['hint type'] == 'w':
        return testCode('weighted', input, student)
    else:
        return testCode('common', input, student)

def runCT(weighted, problem, n):
    """Runs code tester for n student programs of type problem"""
    if verify(yaml2dict(problem + '.yaml')): return
    if weighted: initialiseWeighted(yaml2dict(problem + '.yaml'))
    for i in range(0, n):
        if weighted: testCode('weighted', yaml2dict(problem + '.yaml'), problem + str(i) + '.py')
        else: testCode('common', yaml2dict(problem + '.yaml'), problem + str(i) + '.py')
        print('----------------------------------------------------------------------------------')
    if weighted:
        with open('graphs.object', 'rb') as graph_file:
            graph = pickle.load(graph_file)
        graphObj = graph[1]
        CFG.renderGraph(graphObj[0], graphObj[1], includeID=True)

def printOutput(outputs):
    """Formats the test case output and prints it to the terminal"""
    n = len(outputs)
    for case in range(1, n):
        print(f'Test {case}:')
        if outputs[case]['Pass']:
            out = '\033[32mpassed:\033[m ' + outputs[case]['Feedback']
            print(f'{out}')
        elif outputs[case]['Feedback'] != '':
            out = '\033[33mfailed:\033[m ' + outputs[case]['Feedback']
            print(f'{out}')
        else:
            print(f'\033[31mError:\033[m Your function could not be tested.')
        out = outputs[case]['stdOut']
        err = outputs[case]['stdErr']
        if out != '' and SHOW_STDOUT: print(f'\033[4mstdOut:\033[m\n{out}')
        if err != '' and SHOW_STDERR: print(f'\033[4mstdErr:\033[m\n{err}')
        print()

def getLecturer(src):
    """"Helper function: generates a program dictionary from the lecturer information"""
    inData = inputData()
    inputData.getInput(inData, src)
    return inData

def getStudent(filename):
    """Generates a program dictionary from the student information"""
    try:
        source = open(filename, 'r').read()
        compile(source, filename, 'exec')
        parser = CFG.PyParser(source)
        cfg = CFG.CFGVisitor().build(filename, ast.parse(parser.script))
        programData = program()
        cfg.getData(False, programData) # populates dictionary with program information
    except Exception as e:
        inc('compile')
        exc_type, exc_value, exc_traceback = sys.exc_info()
        ret = []
        if e.__class__ == SyntaxError:
            if TERMINAL: print(f'You have a \33[31mSyntaxError\33[m that starts on line {e.lineno} at character position {e.offset}.')
            else: ret.append('You have a SyntaxError that starts on line ' + str(e.lineno) + ' at character position ' + str(e.offset) + '.')
        if TERMINAL: print(f'\033[31mSubmission failed to compile:\033[m {exc_type} -> {exc_value}')
        else: ret.append('Submission failed to compile: ' + str(exc_type) + ' -> ' + str(exc_value))
        return ret
    
    # generates pdf of cfg
    if DEBUG: cfg.show()

    # prints information collected in dictionaries 
    if DEBUG: programData.printProgram()

    return programData

def checkInstructions(lecturerIn, studentIn, filename):
    """Verifies that a student follows instructions correctly"""
    imports = checkImports(lecturerIn.props, studentIn)
    typeCheck = checkType(studentIn)
    required = checkRequired(lecturerIn.props, studentIn)
    illegal = checkIllegal(lecturerIn.props, studentIn)
    calls = checkCalls(lecturerIn.props, studentIn)
    ops = checkOperators(lecturerIn.props, open(filename, 'r').read())
    if TERMINAL:    
        print(f'{imports}\n{typeCheck}\n{required}\n{illegal}\n{calls}\n{ops}')
        return
    else:
        return {'imports': imports, 'type': typeCheck, 'required': required, 'illegal': illegal, 'calls': calls, 'operators': ops}

def testCode(hintType, yamlDict, student):
    """Helper function: for generating statistics regarding different instances of feedback."""
    web = {'compile': True, 'instructions': {}, 'tests': {}, 'feedback': '', 'errors': '', 'flag': False}
    # get epsilon & timeout values
    epsilon = yamlDict['epsilon']
    timeout = yamlDict['timeout']

    # program get dictionaries
    lecturerIn = getLecturer(yamlDict)
    studentIn = getStudent(student)
    if type(studentIn) != program: 
        web['compile'] = False
        for i in range(0, len(studentIn)):
            web['errors'] += studentIn[i]
        return web
    
    # verify legality of solutions
    web['instructions'] = checkInstructions(lecturerIn, studentIn, student)

    # run test cases
    if hintType == 'common': return commonTest(student, yaml, lecturerIn, studentIn, web, epsilon, timeout)
    elif hintType == 'weighted': 
        return weightedTest(yamlDict, student, web, epsilon, timeout)
    return web

def removeFormatting(s):
    """"Helper function: removes colour printing formatting from text for web export"""
    s = re.sub('\\033\[([0-9]|[a-z]){1,2}m', '', s)
    s = re.sub('\\033\[m', '', s)
    return s

if __name__ == '__main__':
    obj = None
    with open('object.json', 'r') as f:
        obj = json.loads(f.read())
    VERIFY.verify(obj)
    fb = webTests(obj, 'program.py')
    print(fb)
