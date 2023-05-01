import app.util.cfg as myCFG
import sys
import ast
import enum
import re
import importlib
import types
import traceback
from func_timeout import func_timeout, FunctionTimedOut
import json

DEBUG = False
TIMEOUT = 5


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
            # "edges": [],
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
            # "edges": [],
            "nestedLoop": False,
            "calls": []}
        self.name = fname


def getFunc(prog: program, name):
    for func in prog.props["functions"]:
        if func.name == name:
            return (func.props)
    raise 'Function dictionary not found'


class blockType(enum.Enum):
    FOR = 0
    WHILE = 1
    RETURN = 2
    BASIC = 3
    IF = 4
    ELIF = 5
    ELSE = 6
    DEF = 7

    def getType(codeSegment):
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

# checks whether the student has made use of illegal imports


def checkImports(source: input, code: program):
    illegalImps = []
    for imp in code.props["imports"]:
        if imp not in source["imports"]:
            illegalImps.append(imp)
    if len(illegalImps) > 0:
        return 'Warning: You are not allowed to make use of these imports: ' + str(illegalImps) + '. The only imports allowed for this problem are ' + str(source.props["imports"]) + '.'
    else:
        return 'Imports verified: All imports used are legal'

# checks that the submission is of the correct type (program or function) and that the function returns something if required


def checkType(source: input, code: program):
    ret = ''
    if len(code.props["functions"]) == 0:
        ret += 'Warning:This problem requires that you submit a function. You have submitted a program.'
    elif code.props["functions"][0].props["return"]:
        ret += 'Warning: Your function does not return anything. Make sure that your function includes a return statement.'
    if ret == '':
        return 'Submission type verified: The submission is of the correct format.'
    else:
        return ret

# checks that the solution contains the required concepts


def checkRequired(source: input, code: program):
    requirements = source["required"]
    ret = ''
    for func in code.props["functions"]:
        submission = func.props
        if requirements["for"] and not submission["for"]:
            err = 'Your solution to this problem MUST make use of a for loop.\n'
            if err not in ret:
                ret += err
        if requirements["while"] and not submission["while"]:
            err = 'Your solution to this problem MUST  make use of a while loop.\n'
            if err not in ret:
                ret += err
        if requirements["branching"] and not submission["branching"]:
            err = 'Your solution to this problem MUST make use of an if\/elif\/else statement.\n'
            if err not in ret:
                ret += err
        if requirements["recursion"] and not submission["recursion"]:
            err = 'Your solution to this problem MUST make use of recursion.\n'
            if err not in ret:
                ret += err
        if requirements["nested"] and not submission["nestedLoop"]:
            err = 'You MUST  make use of nested loops in your solution.\n'
            if err not in ret:
                ret += err
    if ret == '':
        return 'Submission requirements verified.'
    else:
        return 'The submission failed to meet some requirements: \n' + ret

# checks that the solution does not contain any illegal concepts


def checkIllegal(source: input, code: program):
    illegal = source["illegal"]
    ret = ''
    for func in code.props["functions"]:
        submission = func.props
        if illegal["for"] and submission["for"]:
            err = 'Your solution to this problem MUST NOT make use of a for loop.\n'
            if err not in ret:
                ret += err
        if illegal["while"] and submission["while"]:
            err = 'Your solution to this problem MUST NOT make use of a while loop.\n'
            if err not in ret:
                ret += err
        if illegal["branching"] and submission["branching"]:
            err = 'Your solution to this problem MUST NOT make use of an if\/elif\/else statement.\n'
            if err not in ret:
                ret += err
        if illegal["recursion"] and submission["recursion"]:
            err = 'Your solution to this problem MUST NOT make use of recursion.\n'
            if err not in ret:
                ret += err
        if illegal["nested"] and submission["nestedLoop"]:
            err = 'You MUST NOT make use of nested loops in your solution.\n'
            if err not in ret:
                ret += err
    if ret == '':
        return 'No illegal concepts verified.\n'
    else:
        return 'The submission contains concepts that are not allowed in this exercise: \n' + ret

# returns a dictionary of common program properties when the required submission is a function


def fCommon(data: program):
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

# uses the common dictionary to provide dynamic feedback on the structure of a student submission, where the required submission is a function


def fDynamicFeedback(sub: functions, common):
    ret = ''
    if common["branching"] == common["subs"] and not sub.props["branching"]:
        ret += 'Have you tried using an if\/elif\/else statement to solve this problem?\n'
    if common["recursive"] == common["subs"] and not sub.props["recursive"]:
        if common["loop"] > 0 and common["recursion"] > 0:
            ret += 'Have you tried using loops or recursion to solve this problem?\n'
        elif common["loop"] > 0:
            ret += 'Have you tried using for or while loops to solve this problem?\n'
        elif common["recursion"] > 0:
            ret += 'This problem requires the use of recursion.\n'
    if common["nested"] == common["subs"] and not sub.props["nestedLoop"]:
        ret += 'It looks like you need to use nested loops to solve this problem.\n'
    # check the consistency of params
    if len(common["params"]) > 0:
        p = common["params"][0]
        cnt = 0
        for param in common["params"]:
            if param == p:
                cnt += 1
        if (cnt == len(common["params"])) and p != sub.props["params"]:
            ret += 'Your function should take in ' + \
                str(p) + ' argument(s), but it only takes ' + \
                str(sub.props["params"]) + ' argument(s).\n'
    if common["return"] == common["subs"] and not sub.props["return"]:
        ret += 'Your function needs to return something.\n'
    # check for missing base cases in recursion
    if sub.props["recursion"] and not sub.props["base"]:
        ret += 'Remember: When you implement recursion, you need to include a base case.\n'
    return ret


def getRuntimeError(e, line):
    if e.__class__ == TypeError:
        return 'TypeError: You have attempted an operation or instruction that is invalid for a specific data type on line ' + str(line)
    elif e.__class__ == StopIteration:
        return 'StopIteration: It looks like the next() method of an iterator does not point to any object on line ' + str(line)
    elif e.__class__ == OverflowError:
        return 'OverflowError: One of your calculations has exceeded the maximum limit for the numeric type on line ' + str(line)
    elif e.__class__ == FloatingPointError:
        return 'FloatingPointError: A floating point calculation in your program has failed on line ' + str(line)
    elif e.__class__ == ZeroDivisionError:
        return 'ZeroDivisionError: You have attempted to divide or modulo by 0 on line ' + str(line)
    elif e.__class__ == AttributeError:
        return 'AttributeError: Failed attribute reference or assignment on line ' + str(line)
    elif e.__class__ == EOFError:
        return 'EOFError: You have a raw_input() or input() function that is not receiving any input on line ' + str(line)
    elif e.__class__ == ImportError:
        return 'ImportError: An import statement in your program has failed on line ' + str(line)
    elif e.__class__ == IndexError:
        return 'IndexError: The index could not be found on line ' + str(line)
    elif e.__class__ == KeyError:
        return 'KeyError: You have tried to use a dictionary key that could not be found on line ' + str(line)
    elif e.__class__ == NameError:
        return 'NameError: It looks like you have tried to access a variable that was not declared on line ' + str(line)
    elif e.__class__ == UnboundLocalError:
        return 'UnboundLocalError: You are trying to access a local variable that does not have any value assigned to it on line ' + str(line)
    elif e.__class__ == EnvironmentError:
        return 'EnvironmentError: An exception has occurred outside the Python environment on line ' + str(line)
    elif e.__class__ == IOError:
        return 'IOError: An input or output operation has failed on line ' + str(line)
    elif e.__class__ == OSError:
        return 'OSError: An operating system error has occured on line ' + str(line)
    elif e.__class__ == SyntaxError:
        return 'SyntaxError: There is a mistake in your Python syntax on line ' + str(line)
    elif e.__class__ == IndentationError:
        return 'IndentationError: There is a mistake in your indentations on line ' + str(line)
    elif e.__class__ == SystemError:
        return 'SystemError: The Python Interpreter has encountered an internal problem on line ' + str(line)
    elif e.__class__ == ValueError:
        return 'ValueError: You have specified invalid values for arguments on line ' + str(line)
    elif e.__class__ == RuntimeError:
        return 'RuntimeError: Your program has encountered a runtime error on line ' + str(line)
    elif e.__class__ == NotImplementedError:
        return 'NotImplementedError: You have not implemented an abstract method in an inherited class on line ' + str(line)
    else:
        return 'Error: Your program contains one or more errors on line ' + str(line)

# function to be called by Simon's program
# generates a JSON object containing the various feedback components
# student feedback is made up of 3 components: (1) input_validation, (2) testcase_feedback and (3) static_feedback
# if a student's program fails to compile, a 4th feedback field will be populated and all other fields will remain empty


def genFeedback(file, memo):
    feedbackData = {
        "compile_feedback": "",
        "input_validation": "",
        "testcase_feedback": [],
        "static_feedback": "",
        "cases_passed": 0,
        "total_cases": 0,
        "cases_failed": 0
    }

    # convert solutions to type 'function'

    tmpList = []
    for sol in memo["solutions"]:
        parser = myCFG.PyParser(sol)
        cfg = myCFG.CFGVisitor().build('sample', ast.parse(parser.script))
        programData = program()
        cfg.getData(False, programData)
        tmpList.append(programData)
    memo["solutions"] = tmpList

    # check for compile time errors
    try:
        source = open(file, 'r').read()
        compile(source, file, 'exec')
    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        if e.__class__ == SyntaxError:
            feedbackData["compile_feedback"] += 'You have a SyntaxError that starts on line ' + \
                str(e.lineno) + ' at character position ' + \
                str(e.offset) + '.\n'
        feedbackData["compile_feedback"] += 'Submission failed to compile: ' + \
            str(exc_type) + ' -> ' + str(exc_value) + '\n'
        return json.dumps(feedbackData)
    name = re.search('(\w)+.py$', file).group()
    name = re.sub('.py', "", name)
    try:
        problem = importlib.import_module(name)
    except Exception as e:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        if e.__class__ == SyntaxError:
            feedbackData["compile_feedback"] += 'You have a SyntaxError that starts on line ' + \
                str(e.lineno) + ' at character position ' + \
                str(e.offset) + '.\n'
        feedbackData["compile_feedback"] += 'Submission failed to compile: ' + \
            str(exc_type) + ' -> ' + str(exc_value) + '\n'
        return json.dumps(feedbackData)

    # validate student input
    parser = myCFG.PyParser(source)
    cfg = myCFG.CFGVisitor().build(file, ast.parse(parser.script))
    programData = program()
    cfg.getData(False, programData)
    feedbackData["input_validation"] += checkImports(memo, programData) + '\n'
    feedbackData["input_validation"] += checkType(memo, programData) + '\n'
    feedbackData["input_validation"] += checkRequired(memo, programData) + '\n'
    feedbackData["input_validation"] += checkIllegal(memo, programData) + '\n'

    # run test cases & generate static feedback
    testDict = {}
    bestFunc = {"score": 0}
    availableFunctions = []
    for a in dir(problem):
        if isinstance(getattr(problem, a), types.FunctionType):
            availableFunctions.append(a)
    for func in availableFunctions:
        common = fCommon(memo)
        if not common["multiFunc"] and len(programData.props["functions"]) > 1:
            err = 'It looks like you have written more than 1 function. Can you solve this problem using only 1 function?\n'
            if err not in feedback["static_feedback"]:
                feedbackData["static_feedback"] += err
        else:
            feedbackData["static_feedback"] += fDynamicFeedback(
                programData.props["functions"][0], common)
        myFunction = getattr(problem, func)
        passed = 0
        caseNo = 1
        functionProperties = getFunc(programData, func)
        feedback = ''
        for case in memo["test cases"]:
            caseData = ["case_" + str(caseNo - 1)]
            try:
                if common["params"][0] == functionProperties["params"]:
                    out = func_timeout(TIMEOUT, myFunction, [case["in"]])
                    if out == case["out"]:
                        caseData.append(True)
                        caseData.append(
                            'passed: ' + func + '(' + str(case["in"]) + ') -> ' + str(case["out"]) + '\n')
                        passed = passed + 1
                    else:
                        caseData.append(False)
                        if type(case["out"]) != type(myFunction(case["in"])):
                            exp = re.search(
                                '\'(.)+\'', str(type(case["out"]))).group()
                            got = re.search(
                                '\'(.)+\'', str(type(myFunction(case["in"])))).group()
                            err = 'Your function should return a ' + exp + \
                                ' but it returns a ' + got + ' instead.\n'
                            if err not in feedback:
                                feedback += err
                        caseData.append(
                            'failed:  Expected ' + str(case["out"]) + ', but got ' + str(myFunction(case["in"])) + '\n')
                else:
                    caseData.append(False)
                    caseData.append(
                        'Error: Could not test function: incorrect number of function parameters.\n')
            except FunctionTimedOut:
                caseData.append(False)
                caseData.append('Error: ' + func + ' timed out.\n')
                err = 'Hmm... This submission is timing out. Are you sure you don\'t have infinite loops?\n'
                if err not in feedback:
                    feedback += err
            except Exception as e:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                line = traceback.extract_tb(exc_traceback)[3].lineno
                caseData.append(False)
                caseData.append(getRuntimeError(e, line) +
                                ' -> ' + str(exc_value) + '\n')
            testDict[str(caseNo - 1)] = caseData
            caseNo += 1
        if bestFunc["score"] <= passed:
            feedbackData["cases_passed"] = passed
            feedbackData["total_cases"] = len(memo["test cases"])
            feedbackData["cases_failed"] = feedbackData["total_cases"] - \
                feedbackData["cases_passed"]
            feedbackData["testcase_feedback"] = testDict
            bestFunc["score"] = passed
            bestFunc["dFeedback"] = feedback
    feedbackData["static_feedback"] += bestFunc["dFeedback"]
    if bestFunc["score"] != len(memo["test cases"]):
        feedbackData["static_feedback"] += 'It looks like your solution needs some work. Use the feedback that you have received to make some changes.\n'
    else:
        if feedbackData["static_feedback"] == '':
            feedbackData["static_feedback"] += 'Well Done! You have passed all of the test cases and the structure of your submission matches the sample solutions\n'
        else:
            feedbackData["static_feedback"] += 'Your submission passed all of the test cases, but doesn\'t match the sample solutions. It has been flagged for moderation.\n'

    return json.dumps(feedbackData)


if __name__ == '__main__':
    # filename = sys.argv[1]
    obj = None
    import copy
    with open('object.json', 'r') as f:
        obj = json.loads(f.read())

    obj = genFeedback('p2.py', copy.deepcopy(obj))
    print(f'obj = {obj}')
    obj = genFeedback('p1.py', copy.deepcopy(obj))
    print(f'obj = {obj}')
