from __future__ import annotations
import ast, astor, autopep8, tokenize, io, sys, copy
from pdb import line_prefix
import graphviz as gv
from typing import Dict, List, Tuple, Set, Optional, Type
import feedback as properties
import re
import networkx as nx
from networkx.algorithms import isomorphism
DEBUG_PATHS = False

class SingletonMeta(type):
    _instance: Optional[BlockId] = None

    def __call__(self) -> BlockId:
        if self._instance is None:
            self._instance = super().__call__()
        return self._instance


class BlockId(metaclass=SingletonMeta):
    counter: int = 0

    def gen(self) -> int:
        self.counter += 1
        return self.counter


class BasicBlock:

    def __init__(self, bid: int):
        self.bid: int = bid
        self.stmts: List[Type[ast.AST]] = []
        self.calls: List[str] = []
        self.prev: List[int] = []
        self.next: List[int] = []

    def is_empty(self) -> bool:
        return len(self.stmts) == 0

    def has_next(self) -> bool:
        return len(self.next) != 0

    def has_previous(self) -> bool:
        return len(self.prev) != 0

    def remove_from_prev(self, prev_bid: int) -> None:
        if prev_bid in self.prev:
            self.prev.remove(prev_bid)

    def remove_from_next(self, next_bid: int) -> None:
        if next_bid in self.next:
            self.next.remove(next_bid)

    def stmts_to_code(self) -> str:
        code = ''
        for stmt in self.stmts:
            line = astor.to_source(stmt)
            code += line.split('\n')[0] + "\n" if type(stmt) in [ast.If, ast.For, ast.While, ast.FunctionDef,
                                                                 ast.AsyncFunctionDef] else line
        return code

    def calls_to_code(self) -> str:
        return '\n'.join(self.calls)

class CFG:

    def __init__(self, name: str):
        self.name: str = name
        self.start: Optional[BasicBlock] = None
        self.func_calls: Dict[str, CFG] = {}
        self.blocks: Dict[int, BasicBlock] = {}
        self.edges: Dict[Tuple[int, int], Type[ast.AST]] = {}
        self.graph: Optional[gv.dot.Digraph] = None
        self.nodes: Optional[Node] = None

    def _traverse(self, block: BasicBlock, visited: Set[int] = set(), calls: bool = True) -> None:
        if block.bid not in visited:
            visited.add(block.bid)
            self.graph.node(str(block.bid), label=block.stmts_to_code())
            if calls and block.calls:
                self.graph.node(str(block.bid) + '_call', label=block.calls_to_code(), _attributes={'shape': 'box'})
                self.graph.edge(str(block.bid), str(block.bid) + '_call', label="calls", _attributes={'style': 'dashed'})

            for next_bid in block.next:
                self._traverse(self.blocks[next_bid], visited, calls=calls)
                self.graph.edge(str(block.bid), str(next_bid), label=astor.to_source(self.edges[(block.bid, next_bid)]) if self.edges[(block.bid, next_bid)] else '')

    def _show(self, fmt: str = 'pdf', calls: bool = True) -> gv.dot.Digraph:
        self.graph = gv.Digraph(name='cluster_'+self.name, format=fmt, graph_attr={'label': self.name})
        self._traverse(self.start, calls=calls)
        for k, v in self.func_calls.items():
            self.graph.subgraph(v._show(fmt, calls))
        return self.graph

    def show(self, filepath: str = './output', fmt: str = 'pdf', calls: bool = True, show: bool = True) -> None:
        self._show(fmt, calls)
        self.graph.render(filepath, view=show, cleanup=True)

    # ------------------------------------------------ CodeTester: Weighted Graphs ---------------------------------------------#
    def genGraph(self, block: BasicBlock, start: int,  visited: Set[int] = set()) -> None:
        """Generates the weighted structural graph representation of a function from the cfg of that function

        Recursively traverses the cfg to generate the corresponding weighted structural graph

        Parameters
        ----------
        block : BasicBlock
            The current block in the cfg traversal
        start : int
            The id of the block first visited
        visited : set
            A set of the ids of basic blocks from the cfg that have already been visited
        """
        if block.bid not in visited:
            visited.add(block.bid)
            nodeType = ''

            # ------ check for recursion ------ #
            regex = "(.)*" + self.name + "\((.)*\)(.)*"
            recursion = False
            if bool(re.search(regex, block.stmts_to_code())):
                self.graph.edge(str(block.bid), str(start))
                recursion = True
                nodeType = '(recursive)'
            # --------------------------------- #

            # mark start nodes
            if block.bid == start:
                nodeType += '(source)'
                self.graph.node(str(block.bid), label=nodeType + ': ' + str(block.bid), _attributes={'shape': 'diamond', 'fillcolor': 'green', 'style':'rounded, filled'})

            # mark end nodes
            elif len(block.next) == 0 and not recursion:
                nodeType += '(terminal)'
                self.graph.node(str(block.bid), label=nodeType + ': ' + str(block.bid), _attributes={'shape': 'diamond', 'fillcolor':'red', 'style':'rounded, filled'})

            # mark all other nodes
            else:
                if len(block.next) > 1:
                    nodeType += '(branching)'
                else:
                    nodeType += '(basic)'
                self.graph.node(str(block.bid), label=nodeType + ': ' + str(block.bid), _attributes={'shape': 'circle', 'style':'rounded'})
                
            for next_bid in block.next:
                self.genGraph(self.blocks[next_bid], start, visited)
                self.graph.edge(str(block.bid), str(next_bid))

    def _showGraph(self):
        """Helper: recursively constructs graphs from cfgs for visualization"""
        self.graph = gv.Digraph(name='cluster_'+self.name, format='pdf', graph_attr={'label': self.name})
        self.genGraph(self.start, self.start.bid)
        for k, v in self.func_calls.items():
            self.graph.subgraph(v._showGraph())
        return self.graph

    def showGraph(self):
        """Driver code: for calling _showGraph"""
        self._showGraph()
        self.graph.render('graph', view=True, cleanup=True)

    def getGraphData(self, block: BasicBlock, start: int, visited: Set[int] = set(), dictionary: dict = dict()):
        """Populates a dictionary of graph properties from the cfg

        Parameters
        ----------
        block : BasicBlock
            The current block in the cfg traversal
        start : int
            The id of the block first visited
        visited : set
            A set of the ids of basic blocks from the cfg that have already been visited
        dictionary : dict
            The dictionary of program properties, to be constructed from the cfg of a program
        """
        if block.bid not in visited:
            visited.add(block.bid)
            dictionary["nodes"].append(block.bid)
            
            # ------ check for recursion ------ #
            regex = "(.)*" + self.name + "\((.)*\)(.)*"
            if bool(re.search(regex, block.stmts_to_code())):
                dictionary["edges"].append([block.bid, 0])
                dictionary["rec"].append(block.bid)
            # ------- check for fun def ------- #
            regex = "def (.)*\((.)*\):\n"
            if bool(re.search(regex, block.stmts_to_code())):
                dictionary["nodes"].remove(block.bid)
            else:
                dictionary["meta"].append((block.bid, block.stmts_to_code()))
            # --------------------------------- #

            for next_bid in block.next:
                self.getGraphData(self.blocks[next_bid], start, visited, dictionary)
                dictionary["edges"].append([block.bid, next_bid])
                dictionary["in"]. append(next_bid)
                dictionary["out"].append(block.bid)

    def get(self):
        """Returns a dictionary describing the nodes and edges associated with a structural graph"""
        d = {
            "nodes": [], # the nodes of the cfg
            "edges": [], # the edges of the cfg
            "in": [], # every node entry point of the cfg
            "out": [], # every node exit point of the cfg
            "rec": [], # every node that makes a recurisve call
            "calls": [], 
            "types": [],
            "meta": []
        }
        self.getGraphData(block=self.start, start=self.start.bid, dictionary=d)
        for k, v in self.func_calls.items():
            d["calls"].append([self.start.bid, v.start.bid])
            v.getGraphData(block=v.start, start=v.start.bid, dictionary=d)
        for node in d["nodes"]:
            isStart = True
            for edge in d["edges"]:
                if edge[1] == node and edge[0] < edge[1]: isStart = False
            if isStart and node in d["out"]: d["edges"].append([0, node])
        self.graph = gv.Digraph(name='cluster_'+self.name, format='png', graph_attr={'label': self.name})
        self.graph.node(str(0), label='source')
        for node in d["nodes"]:
            l = ''
            inCnt = 0
            outCnt = 0
            for item in d["in"]:
                if item == node: inCnt += 1
            for item in d["out"]:
                if item == node: outCnt += 1
            else:
                loop = False
                for edge in d["edges"]:
                    if edge[1] == node and edge[0] > edge[1]: loop = True
                if outCnt == 0 and node not in d["rec"]:
                    l = 'terminal-'
                if node in d["rec"]:
                    l += 'recursion'
                elif loop:
                    l += 'loop'
                elif inCnt > 1:
                    l += 'loop'
                elif outCnt > 1:
                    l += 'branch'
                else:
                    l += 'basic'
            self.graph.node(str(node), label=l)
            d["types"].append((node, l))
        for edge in d["edges"]:
            self.graph.edge(str(edge[0]), str(edge[1]))
        return d

    # ------------------------------------------------ CodeTester: Program Dictionaries ---------------------------------------------#

    def getData(self, func = False, prog: properties.functions = None, calls: bool = True, fmt: str = 'pdf'):
        """Recursively traverses the cfg making calls to visitCode() and visitFunction() to populate the program and function dictionaries"""
        # get program info
        if not func:
            self.visitCode(prog, self.start, calls=calls)
        else:
            self.visitFunc(prog, self.start, calls=calls)
        # get function info
        for k, v in self.func_calls.items():
            # find the corresponding function dictionary
            for func in prog.props["functions"]:
                if func.name == v.name:
                    v.getData(True, func, calls, fmt)
                    break
    
    def visitCode(self, prog: properties.program, block: BasicBlock, visited: Set[int] = set(), calls: bool = True) -> None:
        """Traverses cfg to populate program dictionary

        Use regular expressions to match properties

        Parameters
        ----------
        block : BasicBlock
            The current block in the cfg traversal
        start : int
            The id of the block first visited
        visited : set
            A set of the ids of basic blocks from the cfg that have already been visited
        calls : boolean
            A flag used for determining whether calls should be included in the traversal of the cfg
        """
        if block.bid not in visited:
            if bool(re.search("(\n|^)import (.)+", block.stmts_to_code())):
                # continue here
                for line in block.stmts_to_code().splitlines():
                    if bool(re.search("(\n|^)import (.)+$", line)):
                        result = re.sub("(\n|^)import ", "", line)
                        result = re.sub(" as (.)+", "", result)
                        prog.props["imports"].append(result)
            if bool(re.search("(\n|^)while(.)*:$", block.stmts_to_code())):
                prog.props["while"] = True
                prog.props["recursive"] = True
                # check for infinite loop here
            elif bool(re.search("(\n|^)for(.)*:$", block.stmts_to_code())):
                prog.props["for"] = True
                prog.props["recursive"] = True
                # check for infinite loop here
            if bool(re.search("(\n|^)if(.)*:$", block.stmts_to_code())):
                prog.props["branching"] = True
            if bool(re.search("(\n|^)def (.)+\((.)*\):", block.stmts_to_code())):
                func_list = re.split("\n", block.stmts_to_code())
                for func in func_list:
                    if bool(re.search("def (.)+\((.)*\):", func)):
                        name = re.sub("def ", "", func)
                        name = re.sub("\((.)*\):", "", name)
                        newFunc = properties.functions(name)
                        if bool(re.search("(\n|^)def (.)+\((.)+\)", func)):
                            # count params
                            params = re.sub("def (.)+\(", "",func)
                            params = re.sub("\):", "", params)
                            tmp_list = params.split(",")
                            newFunc.props["params"] = len(tmp_list)
                        else:
                            newFunc.props["params"] = 0
                        prog.props["functions"].append(newFunc)
            if block.calls:
                prog.props["calls"].append(block.calls_to_code())

            visited.add(block.bid)

            for next_bid in block.next:
                edgeA = properties.blockType.getType(block.stmts_to_code())
                edgeB =  properties.blockType.getType(self.blocks[next_bid].stmts_to_code())
                if ((edgeA == properties.blockType.FOR or edgeA == properties.blockType.WHILE) and (edgeB == properties.blockType.FOR or edgeB == properties.blockType.WHILE) and block.bid > next_bid):
                    prog.props["nestedLoop"] = True
                self.visitCode(prog, self.blocks[next_bid], visited, calls=calls)

    def visitFunc(self, prog: properties.functions, block: BasicBlock, visited: Set[int] = set(), calls: bool = True) -> None:
        """Traverses cfg to populate function dictionary

        Use regular expressions to match properties

        Parameters
        ----------
        block : BasicBlock
            The current block in the cfg traversal
        start : int
            The id of the block first visited
        visited : set
            A set of the ids of basic blocks from the cfg that have already been visited
        calls : boolean
            A flag used for determining whether calls should be included in the traversal of the cfg
        """
        if block.bid not in visited:
            regex = "(.)*" + prog.name + "\((.)*\)(.)*"
            if bool(re.search(regex, block.stmts_to_code())):
                prog.props["recursion"] = True
                prog.props["recursive"] = True
                if prog.props["branching"]:
                    prog.props["base"] = True
            if bool(re.search("(\n|^)return(.)+", block.stmts_to_code())):
                prog.props["return"] = True
                if bool(re.search("(\n|^)return (.)+([a-zA-Z]|[0-9])+\((.)*\)", block.stmts_to_code())):
                    sub = re.search("(\n|^)return (.)+([a-zA-Z]|[0-9])+\((.)*\)", block.stmts_to_code()).group()
                    sub = re.sub("(\n|^)return ", "", sub)
                    sub = re.search("([a-zA-Z]|[0-9])+\((.)*\)", sub).group()
                    sub = re.sub("\((.)*\)", "", sub)
                    if sub != prog.name:
                        prog.props["calls"].append(sub)
            if bool(re.search("(\n|^)for(.)*:$", block.stmts_to_code())):
                prog.props["for"] = True
                prog.props["recursive"] = True
                #check for infinite loop
            elif bool(re.search("(\n|^)while(.)*:$", block.stmts_to_code())):
                prog.props["while"] = True
                prog.props["recursive"] = True
                # check for infinite loop
            if bool(re.search("(\n|^)if(.)*:$", block.stmts_to_code())):
                prog.props["branching"] = True
                if prog.props["recursion"]:
                    prog.props["base"] = True
            try:
                c2c = block.calls_to_code()
            except:
                c2c = None
            if block.calls and c2c != prog.name and c2c != None:
                prog.props["calls"].append(block.calls_to_code())

            visited.add(block.bid)

            for next_bid in block.next:
                edgeA = properties.blockType.getType(block.stmts_to_code())
                edgeB =  properties.blockType.getType(self.blocks[next_bid].stmts_to_code())
                if ((edgeA == properties.blockType.FOR or edgeA == properties.blockType.WHILE) and (edgeB == properties.blockType.FOR or edgeB == properties.blockType.WHILE) and block.bid > next_bid):
                    prog.props["nestedLoop"] = True
                self.visitFunc(prog, self.blocks[next_bid], visited, calls=calls)

class CFGVisitor(ast.NodeVisitor):

    invertComparators: Dict[Type[ast.AST], Type[ast.AST]] = {ast.Eq: ast.NotEq, ast.NotEq: ast.Eq, ast.Lt: ast.GtE,
                                                               ast.LtE: ast.Gt,
                                                               ast.Gt: ast.LtE, ast.GtE: ast.Lt, ast.Is: ast.IsNot,
                                                               ast.IsNot: ast.Is, ast.In: ast.NotIn, ast.NotIn: ast.In}

    def __init__(self):
        super().__init__()
        self.loop_stack: List[BasicBlock] = []
        self.ifExp = False

    def build(self, name: str, tree: Type[ast.AST]) -> CFG:
        self.cfg = CFG(name)
        self.curr_block = self.new_block()
        self.cfg.start = self.curr_block

        self.visit(tree)
        self.remove_empty_blocks(self.cfg.start)
        return self.cfg

    def new_block(self) -> BasicBlock:
        bid: int = BlockId().gen()
        self.cfg.blocks[bid] = BasicBlock(bid)
        return self.cfg.blocks[bid]

    def add_stmt(self, block: BasicBlock, stmt: Type[ast.AST]) -> None:
        block.stmts.append(stmt)

    def add_edge(self, frm_id: int, to_id: int, condition=None) -> BasicBlock:
        self.cfg.blocks[frm_id].next.append(to_id)
        self.cfg.blocks[to_id].prev.append(frm_id)
        self.cfg.edges[(frm_id, to_id)] = condition
        return self.cfg.blocks[to_id]

    def add_loop_block(self) -> BasicBlock:
        if self.curr_block.is_empty() and not self.curr_block.has_next():
            return self.curr_block
        else:
            loop_block = self.new_block()
            self.add_edge(self.curr_block.bid, loop_block.bid)
            return loop_block

    def add_subgraph(self, tree: Type[ast.AST]) -> None:
        self.cfg.func_calls[tree.name] = CFGVisitor().build(tree.name, ast.Module(body=tree.body))

    def add_condition(self, cond1: Optional[Type[ast.AST]], cond2: Optional[Type[ast.AST]]) -> Optional[Type[ast.AST]]:
        if cond1 and cond2:
            return ast.BoolOp(ast.And(), values=[cond1, cond2])
        else:
            return cond1 if cond1 else cond2

    def remove_empty_blocks(self, block: BasicBlock, visited: Set[int] = set()) -> None:
        if block.bid not in visited:
            visited.add(block.bid)
            if block.is_empty():
                for prev_bid in block.prev:
                    prev_block = self.cfg.blocks[prev_bid]
                    for next_bid in block.next:
                        next_block = self.cfg.blocks[next_bid]
                        self.add_edge(prev_bid, next_bid, self.add_condition(self.cfg.edges.get((prev_bid, block.bid)), self.cfg.edges.get((block.bid, next_bid))))
                        self.cfg.edges.pop((block.bid, next_bid), None)
                        next_block.remove_from_prev(block.bid)
                    self.cfg.edges.pop((prev_bid, block.bid), None)
                    prev_block.remove_from_next(block.bid)
                block.prev.clear()
                for next_bid in block.next:
                    self.remove_empty_blocks(self.cfg.blocks[next_bid], visited)
                block.next.clear()

            else:
                for next_bid in block.next:
                    self.remove_empty_blocks(self.cfg.blocks[next_bid], visited)

    def invert(self, node: Type[ast.AST]) -> Type[ast.AST]:
        if type(node) == ast.Compare:
            if len(node.ops) == 1:
                return ast.Compare(left=node.left, ops=[self.invertComparators[type(node.ops[0])]()], comparators=node.comparators)
            else:
                tmpNode = ast.BoolOp(op=ast.And(), values = [ast.Compare(left=node.left, ops=[node.ops[0]], comparators=[node.comparators[0]])])
                for i in range(0, len(node.ops) - 1):
                    tmpNode.values.append(ast.Compare(left=node.comparators[i], ops=[node.ops[i+1]], comparators=[node.comparators[i+1]]))
                return self.invert(tmpNode)
        elif isinstance(node, ast.BinOp) and type(node.op) in self.invertComparators:
            return ast.BinOp(node.left, self.invertComparators[type(node.op)](), node.right)
        elif type(node) == ast.NameConstant and type(node.value) == bool:
            return ast.NameConstant(value=not node.value)
        elif type(node) == ast.BoolOp:
            return ast.BoolOp(values = [self.invert(x) for x in node.values], op = {ast.And: ast.Or(), ast.Or: ast.And()}.get(type(node.op)))
        elif type(node) == ast.UnaryOp:
            return self.UnaryopInvert(node)
        else:
            return ast.UnaryOp(op=ast.Not(), operand=node)

    def UnaryopInvert(self, node: Type[ast.AST]) -> Type[ast.AST]:
        if type(node.op) == ast.UAdd:
            return ast.UnaryOp(op=ast.USub(),operand = node.operand)
        elif type(node.op) == ast.USub:
            return ast.UnaryOp(op=ast.UAdd(),operand = node.operand)
        elif type(node.op) == ast.Invert:
            return ast.UnaryOp(op=ast.Not(), operand=node)
        else:
            return node.operand

    def combine_conditions(self, node_list: List[Type[ast.AST]]) -> Type[ast.AST]:
        return node_list[0] if len(node_list) == 1 else ast.BoolOp(op=ast.And(), values = node_list)

    def generic_visit(self, node):
        if type(node) in [ast.Import, ast.ImportFrom]:
            self.add_stmt(self.curr_block, node)
            return
        if type(node) in [ast.FunctionDef, ast.AsyncFunctionDef]:
            self.add_stmt(self.curr_block, node)
            self.add_subgraph(node)
            return
        if type(node) in [ast.AnnAssign, ast.AugAssign]:
            self.add_stmt(self.curr_block, node)
        super().generic_visit(node)

    def get_function_name(self, node: Type[ast.AST]) -> str:
        if type(node) == ast.Name:
            return node.id
        elif type(node) == ast.Attribute:
            return self.get_function_name(node.value) + '.' + node.attr
        elif type(node) == ast.Str:
            return node.s
        elif type(node) == ast.Subscript:
            return node.value.id
        elif type(node) == ast.Lambda:
            return 'lambda function'

    def populate_body(self, body_list: List[Type[ast.AST]], to_bid: int) -> None:
        for child in body_list:
            self.visit(child)
        if not self.curr_block.next:
            self.add_edge(self.curr_block.bid, to_bid)

    # assert type check
    def visit_Assert(self, node):
        self.add_stmt(self.curr_block, node)
        self.curr_block = self.add_edge(self.curr_block.bid, self.new_block().bid, node.test)
        self.generic_visit(node)

    def visit_Assign(self, node):
        if type(node.value) in [ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp, ast.Lambda] and len(node.targets) == 1 and type(node.targets[0]) == ast.Name: # is this entire statement necessary?
            if type(node.value) == ast.ListComp:
                self.add_stmt(self.curr_block, ast.Assign(targets=[ast.Name(id=node.targets[0].id, ctx=ast.Store())], value=ast.List(elts=[], ctx=ast.Load())))
                self.listCompReg = (node.targets[0].id, node.value)
            elif type(node.value) == ast.SetComp:
                self.add_stmt(self.curr_block, ast.Assign(targets=[ast.Name(id=node.targets[0].id, ctx=ast.Store())], value=ast.Call(func=ast.Name(id='set', ctx=ast.Load()), args=[], keywords=[])))
                self.setCompReg = (node.targets[0].id, node.value)
            elif type(node.value) == ast.DictComp:
                self.add_stmt(self.curr_block, ast.Assign(targets=[ast.Name(id=node.targets[0].id, ctx=ast.Store())], value=ast.Dict(keys=[], values=[])))
                self.dictCompReg = (node.targets[0].id, node.value)
            elif type(node.value) == ast.GeneratorExp:
                self.add_stmt(self.curr_block, ast.Assign(targets=[ast.Name(id=node.targets[0].id, ctx=ast.Store())], value=ast.Call(func=ast.Name(id='__' + node.targets[0].id + 'Generator__', ctx=ast.Load()), args=[], keywords=[])))
                self.genExpReg = (node.targets[0].id, node.value)
            else:
                self.lambdaReg = (node.targets[0].id, node.value)
        else:
            self.add_stmt(self.curr_block, node)
        self.generic_visit(node)

    def visit_Await(self, node):
        afterawait_block = self.new_block()
        self.add_edge(self.curr_block.bid, afterawait_block.bid)
        self.generic_visit(node)
        self.curr_block = afterawait_block

    def visit_Break(self, node):
        assert len(self.loop_stack), "Found break not inside loop"
        self.add_edge(self.curr_block.bid, self.loop_stack[-1].bid, ast.Break())

    def visit_Call(self, node):
        if type(node.func) == ast.Lambda:
            self.lambdaReg = ('Anonymous Function', node.func)
            self.generic_visit(node)
        else:
            self.curr_block.calls.append(self.get_function_name(node.func))

    def visit_Continue(self, node):
        pass

    def visit_DictComp_Rec(self, generators: List[Type[ast.AST]]) -> List[Type[ast.AST]]:
        if not generators:
            if self.dictCompReg[0]: # bug if there is else statement in comprehension
                return [ast.Assign(targets=[ast.Subscript(value=ast.Name(id=self.dictCompReg[0], ctx=ast.Load()), slice=ast.Index(value=self.dictCompReg[1].key), ctx=ast.Store())], value=self.dictCompReg[1].value)]
        else:
            return [ast.For(target=generators[-1].target, iter=generators[-1].iter, body=[ast.If(test=self.combine_conditions(generators[-1].ifs), body=self.visit_DictComp_Rec(generators[:-1]), orelse=[])] if generators[-1].ifs else self.visit_DictComp_Rec(generators[:-1]), orelse=[])]

    def visit_DictComp(self, node):
        try: # try may change to checking if self.dictCompReg exists
            self.generic_visit(ast.Module(self.visit_DictComp_Rec(self.dictCompReg[1].generators)))
        except:
            pass
        finally:
            self.dictCompReg = None

    # ignore the case when using set or dict comprehension or generator expression but the result is not assigned to a variable
    def visit_Expr(self, node):
        if type(node.value) == ast.ListComp and type(node.value.elt) == ast.Call:
            self.listCompReg = (None, node.value)
        elif type(node.value) == ast.Lambda:
            self.lambdaReg = ('Anonymous Function', node.value)
        else:
            self.add_stmt(self.curr_block, node)
        self.generic_visit(node)

    def visit_For(self, node):
        loop_guard = self.add_loop_block()
        self.curr_block = loop_guard
        self.add_stmt(self.curr_block, node)
        # New block for the body of the for-loop.
        for_block = self.add_edge(self.curr_block.bid, self.new_block().bid)
        if not node.orelse:
            # Block of code after the for loop.
            afterfor_block = self.add_edge(self.curr_block.bid, self.new_block().bid)
            self.loop_stack.append(afterfor_block)
            self.curr_block = for_block

            self.populate_body(node.body, loop_guard.bid)
        else:
            # Block of code after the for loop.
            afterfor_block = self.new_block()
            orelse_block = self.add_edge(self.curr_block.bid, self.new_block().bid, ast.Name(id='else', ctx=ast.Load()))
            self.loop_stack.append(afterfor_block)
            self.curr_block = for_block

            self.populate_body(node.body, loop_guard.bid)

            self.curr_block = orelse_block
            for child in node.orelse:
                self.visit(child)
            self.add_edge(orelse_block.bid, afterfor_block.bid)
        
        # Continue building the CFG in the after-for block.
        self.curr_block = afterfor_block        

    def visit_GeneratorExp_Rec(self, generators: List[Type[ast.AST]]) -> List[Type[ast.AST]]:
        if not generators:
            self.generic_visit(self.genExpReg[1].elt) # the location of the node may be wrong
            if self.genExpReg[0]: # bug if there is else statement in comprehension
                return [ast.Expr(value=ast.Yield(value=self.genExpReg[1].elt))]
        else:
            return [ast.For(target=generators[-1].target, iter=generators[-1].iter, body=[ast.If(test=self.combine_conditions(generators[-1].ifs), body=self.visit_GeneratorExp_Rec(generators[:-1]), orelse=[])] if generators[-1].ifs else self.visit_GeneratorExp_Rec(generators[:-1]), orelse=[])]

    def visit_GeneratorExp(self, node):
        try: # try may change to checking if self.genExpReg exists
            self.generic_visit(ast.FunctionDef(name='__' + self.genExpReg[0] + 'Generator__', 
                args=ast.arguments(args=[], vararg=None, kwonlyargs=[], kw_defaults=[], kwarg=None, defaults=[]),
                body = self.visit_GeneratorExp_Rec(self.genExpReg[1].generators), 
                decorator_list=[], returns=None))
        except:
            pass
        finally:
            self.genExpReg = None

    def visit_If(self, node):
        # Add the If statement at the end of the current block.
        self.add_stmt(self.curr_block, node)

        # Create a block for the code after the if-else.
        afterif_block = self.new_block()
        # Create a new block for the body of the if.
        if_block = self.add_edge(self.curr_block.bid, self.new_block().bid, node.test)

        # New block for the body of the else if there is an else clause.
        if node.orelse:
            self.curr_block = self.add_edge(self.curr_block.bid, self.new_block().bid, self.invert(node.test))

            # Visit the children in the body of the else to populate the block.
            self.populate_body(node.orelse, afterif_block.bid)
        else:
            self.add_edge(self.curr_block.bid, afterif_block.bid, self.invert(node.test))

        # Visit children to populate the if block.
        self.curr_block = if_block

        self.populate_body(node.body, afterif_block.bid)

        # Continue building the CFG in the after-if block.
        self.curr_block = afterif_block

    def visit_IfExp_Rec(self, node: Type[ast.AST]) -> List[Type[ast.AST]]:
        return [ast.If(test=node.test, body=[ast.Return(value=node.body)], orelse=self.visit_IfExp_Rec(node.orelse) if type(node.orelse) == ast.IfExp else [ast.Return(value=node.orelse)])]

    def visit_IfExp(self, node):
        if self.ifExp:
            self.generic_visit(ast.Module(self.visit_IfExp_Rec(node)))

    def visit_Lambda(self, node): # deprecated since there is autopep8
        self.add_subgraph(ast.FunctionDef(name=self.lambdaReg[0], args=node.args, body = [ast.Return(value=node.body)], decorator_list=[], returns=None))
        self.lambdaReg = None

    def visit_ListComp_Rec(self, generators: List[Type[ast.AST]]) -> List[Type[ast.AST]]:
        if not generators:
            self.generic_visit(self.listCompReg[1].elt) # the location of the node may be wrong
            if self.listCompReg[0]: # bug if there is else statement in comprehension
                return [ast.Expr(value=ast.Call(func=ast.Attribute(value=ast.Name(id=self.listCompReg[0], ctx=ast.Load()), attr='append', ctx=ast.Load()), args=[self.listCompReg[1].elt], keywords=[]))]
            else:
                return [ast.Expr(value=self.listCompReg[1].elt)]
        else:
            return [ast.For(target=generators[-1].target, iter=generators[-1].iter, body=[ast.If(test=self.combine_conditions(generators[-1].ifs), body=self.visit_ListComp_Rec(generators[:-1]), orelse=[])] if generators[-1].ifs else self.visit_ListComp_Rec(generators[:-1]), orelse=[])]

    def visit_ListComp(self, node):
        try: # try may change to checking if self.listCompReg exists
            self.generic_visit(ast.Module(self.visit_ListComp_Rec(self.listCompReg[1].generators)))
        except:
            pass
        finally:
            self.listCompReg = None

    def visit_Pass(self, node):
        self.add_stmt(self.curr_block, node)

    def visit_Raise(self, node):
        self.add_stmt(self.curr_block, node)
        self.curr_block = self.new_block()

    def visit_Return(self, node):
        if type(node.value) == ast.IfExp:
            self.ifExp = True
            self.generic_visit(node)
            self.ifExp = False
        else:
            self.add_stmt(self.curr_block, node)
        self.curr_block = self.new_block()

    def visit_SetComp_Rec(self, generators: List[Type[ast.AST]]) -> List[Type[ast.AST]]:
        if not generators:
            self.generic_visit(self.setCompReg[1].elt) # the location of the node may be wrong
            if self.setCompReg[0]:
                return [ast.Expr(value=ast.Call(func=ast.Attribute(value=ast.Name(id=self.setCompReg[0], ctx=ast.Load()), attr='add', ctx=ast.Load()), args=[self.setCompReg[1].elt], keywords=[]))]
            else: # not supported yet
                return [ast.Expr(value=self.setCompReg[1].elt)]
        else:
            return [ast.For(target=generators[-1].target, iter=generators[-1].iter, body=[ast.If(test=self.combine_conditions(generators[-1].ifs), body=self.visit_SetComp_Rec(generators[:-1]), orelse=[])] if generators[-1].ifs else self.visit_SetComp_Rec(generators[:-1]), orelse=[])]

    def visit_SetComp(self, node):
        try: # try may change to checking if self.setCompReg exists
            self.generic_visit(ast.Module(self.visit_SetComp_Rec(self.setCompReg[1].generators)))
        except:
            pass
        finally:
            self.setCompReg = None

    def visit_Try(self, node):
        loop_guard = self.add_loop_block()
        self.curr_block = loop_guard
        self.add_stmt(loop_guard, ast.Try(body=[], handlers=[], orelse=[], finalbody=[]))

        after_try_block = self.new_block()
        self.add_stmt(after_try_block, ast.Name(id='handle errors', ctx=ast.Load()))
        self.populate_body(node.body, after_try_block.bid)

        self.curr_block = after_try_block

        if node.handlers:
            for handler in node.handlers:
                before_handler_block = self.new_block()
                self.curr_block = before_handler_block
                self.add_edge(after_try_block.bid, before_handler_block.bid, handler.type if handler.type else ast.Name(id='Error', ctx=ast.Load()))

                after_handler_block = self.new_block()
                self.add_stmt(after_handler_block, ast.Name(id='end except', ctx=ast.Load()))
                self.populate_body(handler.body, after_handler_block.bid)
                self.add_edge(after_handler_block.bid, after_try_block.bid)

        if node.orelse:
            before_else_block = self.new_block()
            self.curr_block = before_else_block
            self.add_edge(after_try_block.bid, before_else_block.bid, ast.Name(id='No Error', ctx=ast.Load()))

            after_else_block = self.new_block()
            self.add_stmt(after_else_block, ast.Name(id='end no error', ctx=ast.Load()))
            self.populate_body(node.orelse, after_else_block.bid)
            self.add_edge(after_else_block.bid, after_try_block.bid)

        finally_block = self.new_block()
        self.curr_block = finally_block

        if node.finalbody:
            self.add_edge(after_try_block.bid, finally_block.bid, ast.Name(id='Finally', ctx=ast.Load()))
            after_finally_block = self.new_block()
            self.populate_body(node.finalbody, after_finally_block.bid)
            self.curr_block = after_finally_block
        else:
            self.add_edge(after_try_block.bid, finally_block.bid)

    def visit_While(self, node):
        loop_guard = self.add_loop_block()
        self.curr_block = loop_guard
        self.add_stmt(loop_guard, node)
        afterwhile_block = self.new_block()
        self.loop_stack.append(afterwhile_block)
        inverted_test = self.invert(node.test)

        if not node.orelse:
            if not (isinstance(inverted_test, ast.NameConstant) and inverted_test.value == False):
                self.add_edge(self.curr_block.bid, afterwhile_block.bid, inverted_test)
            self.curr_block = self.add_edge(self.curr_block.bid, self.new_block().bid, node.test)

            self.populate_body(node.body, loop_guard.bid)
        else:
            orelse_block = self.new_block()
            if not (isinstance(inverted_test, ast.NameConstant) and inverted_test.value == False):
                self.add_edge(self.curr_block.bid, orelse_block.bid, inverted_test)
            self.curr_block = self.add_edge(self.curr_block.bid, self.new_block().bid, node.test)

            self.populate_body(node.body, loop_guard.bid)
            self.curr_block = orelse_block
            for child in node.orelse:
                self.visit(child)
            self.add_edge(orelse_block.bid, afterwhile_block.bid)

        # Continue building the CFG in the after-while block.
        self.curr_block = afterwhile_block
        self.loop_stack.pop()

    def visit_Yield(self, node):
        self.curr_block = self.add_edge(self.curr_block.bid, self.new_block().bid)


class PyParser:

    def __init__(self, script):
        self.script = script

    def formatCode(self):
        self.script = autopep8.fix_code(self.script)

    # https://github.com/liftoff/pyminifier/blob/master/pyminifier/minification.py
    def removeCommentsAndDocstrings(self):
        io_obj = io.StringIO(self.script)  # ByteIO for Python2?
        out = ""
        prev_toktype = tokenize.INDENT
        last_lineno = -1
        last_col = 0
        for tok in tokenize.generate_tokens(io_obj.readline):
            token_type = tok[0]
            token_string = tok[1]
            start_line, start_col = tok[2]
            end_line, end_col = tok[3]
            if start_line > last_lineno:
                last_col = 0
            if start_col > last_col:
                out += (" " * (start_col - last_col))
            # Remove comments:
            if token_type == tokenize.COMMENT:
                pass
            # This series of conditionals removes docstrings:
            elif token_type == tokenize.STRING:
                if prev_toktype != tokenize.INDENT:
                    # This is likely a docstring; double-check we're not inside an operator:
                    if prev_toktype != tokenize.NEWLINE:
                        # Note regarding NEWLINE vs NL: The tokenize module
                        # differentiates between newlines that start a new statement
                        # and newlines inside of operators such as parens, brackes,
                        # and curly braces.  Newlines inside of operators are
                        # NEWLINE and newlines that start new code are NL.
                        # Catch whole-module docstrings:
                        if start_col > 0:
                            # Unlabelled indentation means we're inside an operator
                            out += token_string
                        # Note regarding the INDENT token: The tokenize module does
                        # not label indentation inside of an operator (parens,
                        # brackets, and curly braces) as actual indentation.
                        # For example:
                        # def foo():
                        #     "The spaces before this docstring are tokenize.INDENT"
                        #     test = [
                        #         "The spaces before this string do not get a token"
                        #     ]
            else:
                out += token_string
            prev_toktype = token_type
            last_col = end_col
            last_lineno = end_line
        self.script = out

# ------------------------------------------------ CodeTester: Helper Functions & Classes ---------------------------------------------#
class Node:
    """Class defining nodes in the structural graph associated with a program

    Attributes
    ----------
    id : int
        A unique id associated with each node in the graph
    type : str
        The type associated with a node (basic, loop, branching, terminal, source or recursion)
    next : list
        A list of the nodes that are direct children of this node
    code : str
        Any code segments from the original program, associated with the node (for now, this is metadata that is not used)

    Methods
    -------
    addNext(nxt)
        Adds a node to the list of children associated with a node
    """
    def __init__(self, nodeType: str, identifier: int, metaData: str):
        self.id = identifier
        self.type = nodeType
        self.next = []
        self.code = metaData
    
    def addNext(self, nxt: Node):
        """Adds a node to the list of children associated with a node"""
        self.next.append(nxt)

class Edge:
    """Class defining nodes in the structural graph associated with a program

    Attributes
    ----------
    weight : int
        The weight associated with an edge in the structural graph
    start : int
        The id of the node from which the edge originates
    end : int
        The id of the node that the edge enters

    Methods
    -------
    addWeight(w)
        Increments the weight of an edge by w
    """
    def __init__(self, start: int, end: int):
        self.weight = 0
        self.start = start
        self.end = end
    
    def addWeight(self, w: int):
        """Increments the weight of an edge by w"""
        self.weight += w

def getNode(id, Nodes):
    """Helper function: gets the type of a node by node id from the list of nodes making up a graph"""
    for node in Nodes:
        if node.id == id:
            return node
    return None

def getType(dictionary, id):
    """Helper function: gets the type of a node from the structural dictionary by node id"""
    for k, v in dictionary["types"]:
        if k == id:
            return v
    return None

def getCode(dictionary, id):
    """Helper function: gets the code associated with a node"""
    for k, v in dictionary["meta"]:
        if k == id:
            return v
    return None

def printNodes(nodes):
    """Helper function: prints a structural graph by means of the data contained in nodes"""
    for node in nodes:
        edges = []
        for edge in node.next:
            edges.append(edge.id)
        print(f'{node.id}: {node.type} -> {edges}')
    print(f'')

def getEdges(nodes):
    """Helper function: returns all of the edges connecting the nodes in nodes"""
    edgeList = []
    for node in nodes:
        for edge in node.next:
            newEdge = Edge(node.id, edge.id)
            edgeList.append(newEdge)
    return edgeList

def getWeight(edges, s, e):
    """Helper function: returns the weight of the edge from node s to node e"""
    for edge in edges:
        if edge.start == s and edge.end == e:
            return edge.weight
    return None

def renderGraph(nodes, edges=None, n='structuralGraph', visual=True, includeID = False):
    """Helper function: for rendering a visual representation of the structural graph of a program"""
    if edges is None: edges = getEdges(nodes)
    structuralGraph = gv.Digraph(name=n, format='png', graph_attr={'label': n})
    for node in nodes:
        if includeID: structuralGraph.node(str(node.id), label=node.type + ' (' + str(node.id) + ')')
        else: structuralGraph.node(str(node.id), label=node.type)
    for node in nodes:
        for nxt in node.next:
            structuralGraph.edge(str(node.id), str(nxt.id), label=str(getWeight(edges, node.id, nxt.id)))
    structuralGraph.render(n, view=visual, cleanup=True)

def drawGraph(G, name):
    """Helper function: renders a networkx representation of a graph G with called name"""
    plt.clf()
    nx.draw(G)
    plt.draw()
    plt.savefig(name + '.png')

def nxGraph(nodes):
    """Helper function: returns the networkx digraph corresponding to the node structure supplied as a node list"""
    G1 = nx.DiGraph()
    G1.clear()
    for node in nodes:
        G1.add_node(node.id)
        for edge in node.next:
            G1.add_edge(node.id, edge.id)
    return G1

# ------------------------------------------------ CodeTester: Weighted Graph Hint Generation ---------------------------------------------#
def iterate(dictionary, currID, Nodes):
    """Generates the weighted structural graph representation of a function

    Recursively visits the nodes and edges contained in the dictionary describing the nodes and edges of the structural graph

    Parameters
    ----------
    dictionary : dict
        Dictionary of program properties (nodes and edges)
    currID : int
        The id the current node in the traversal
    Nodes : list
        The set of all nodes contained in the structural graph
    """
    curr = getNode(currID, Nodes)
    if len(dictionary['edges']) == 0 and len(dictionary['nodes']) != 0:
        for node in dictionary['nodes']:
            n = Node(getType(dictionary, node), node, getCode(dictionary, node))
            if 'terminal' in n.type:
                nodeType = re.sub(r'terminal-', '', n.type)
                n.type = nodeType
                n.addNext(getNode(-1, Nodes))
            Nodes.append(n)
            curr.next.append(n)
    for edge in dictionary['edges']:
        if edge[0] == currID:
            n = getNode(edge[1], Nodes)
            if n == None:
                n = Node(getType(dictionary, edge[1]), edge[1], getCode(dictionary, edge[1]))
                if 'terminal' in n.type:
                    nodeType = re.sub(r'terminal-', '', n.type)
                    n.type = nodeType
                    n.addNext(getNode(-1, Nodes))
                Nodes.append(n)
                iterate(dictionary, edge[1], Nodes)
            curr.next.append(n)

def callIterate(dictionary):
    """Driver code: for iterating over a program dictionary to produce a structural graph of the program"""
    existingNodes = []
    existingNodes.append(Node('source', 0, ''))
    existingNodes.append(Node('terminal', -1, ''))
    iterate(dictionary, 0, existingNodes)
    return existingNodes

def isomorphic(nodes1, nodes2):
    """returns true if the graph represented by nodes1 is isomorphic to the graph represented by nodes2 and false otherwise

    Uses the isomorphism functionality from the networkx library

    Parameters
    ----------
    nodes1 : list
        The nodes associated with the structural graph of program A
    nodes2 : list
        The nodes associated with the structural graph of program B
    """
    G1 = nxGraph(nodes1)
    G2 = nxGraph(nodes2)
    GM = isomorphism.DiGraphMatcher(G1,G2)
    # verify that matched nodes are of the same type
    verification = GM.is_isomorphic()
    if verification:
        iterator = GM.isomorphisms_iter()
        for matchList in iterator:
            possible = True
            for key in matchList:
                t1 = getNode(key, nodes1).type
                t2 = getNode(matchList[key], nodes2).type
                if t1 != t2:
                    possible = False
                    break
            if possible:
                return True
    return False

def getMatching(main, solution):
    """Returns the isomorphic matching of graphs main and solution

    Uses the isomorphism functionality from the networkx library

    Parameters
    ----------
    main : list
        The nodes associated with the structural graph of the student submission
    solution : list
        The nodes associated with the structural graph of the solutions to a programming problem
    """
    G1 = nxGraph(main)
    G2 = nxGraph(solution)
    GM = isomorphism.DiGraphMatcher(G1,G2)
    # verify that matched nodes are of the same type
    verification = GM.is_isomorphic()
    if verification:
        iterator = GM.isomorphisms_iter()
        for matchList in iterator:
            possible = True
            matches = []
            for key in matchList:
                matches.append((key, matchList[key]))
                t1 = getNode(key, main).type
                t2 = getNode(matchList[key], solution).type
                if t1 != t2:
                    possible = False
                    break
            if possible:
                return matches
    return None

def genPaths(G):
    """Generate all of the possible paths through the solution graph from node with id a to node with id b

    Used for linearizing the solutions represented by the weighted solution graph

    Parameters
    ----------
    G : list
        The list of nodes representing the weighted solution graph
    """
    paths = []
    paths = pathFinder(G, 0, -1, paths, [])
    if DEBUG_PATHS:
        print('ORIGINAL:')
        for path in paths:
            print(path)
        print('---')
    i = 0
    while i < len(paths):
        j = i + 1
        while j < len(paths):
            for node in paths[j]:
                if (node in paths[i] and node != 0 and node != -1) or (type(node) == list and node[0] in paths[i]) or ([node] in paths[i]):
                    newList = copy.deepcopy(paths[i])
                    prev = paths[j][0]
                    for x in range(0, len(paths[j])):
                        n = paths[j][x]
                        if n not in newList and [n] not in newList:
                            try:
                                pos = newList.index(prev)
                            except:
                                pos = newList.index([prev])
                            if type(n) == list:
                                newList.insert(pos+1, n)
                            else: 
                                newList.insert(pos+1, [n])
                        prev = paths[j][x]
                    for x in range(0, len(newList)):
                        val = newList[x]
                        if newList[x] not in paths[j]:
                            if type(val) == list and val[0] in paths[j]:
                                pass
                            elif type(val) != list:
                                newList.remove(newList[x])
                                newList.insert(x, [val])
                    paths.remove(paths[j])
                    paths.remove(paths[i])
                    paths.insert(i, newList)
                    j -= 1
                    break
            j += 1
        i += 1
    if DEBUG_PATHS:
        print('NEW:')
        for path in paths:
            print(path)
    convertPaths(G, paths)
    return paths

def pathFinder(G, a: int, b: int, allPaths, allVisited):
    """Returns a list representing the simple paths through graph G from node a to b

    Uses the simple paths functionality from the networkx library

    Parameters
    ----------
    G : list
        The list of nodes representing the weighted solution graph
    a : int
        The id associated with the start node of the simple path
    b : int
        The id associated with the end node of the simple path
    allPaths : list
        The list of all possible paths between a and b
    visited : list
        The list of nodes already included in the path
    """
    G1 = nxGraph(G)
    iterator = nx.all_simple_paths(G1, a, b)
    for path in iterator:
        i = 1
        for node in path:
            if node in allVisited and node != 0 and node != -1:
                if a != 0 or b != -1: path.remove(node)
            elif node != 0 and node != -1: allVisited.append(node)
        for node in path:
            n = getNode(node, G)
            if n is not None and n.type == 'loop':
                for loopNode in n.next:
                    if loopNode.id not in allVisited:
                        paths = []
                        pathFinder(G, loopNode.id, n.id, paths, allVisited)
                        original = copy.deepcopy(path)
                        for j in range(0, len(paths)):
                            if j == 0:
                                path.insert(i, paths[j])
                            else:
                                new = copy.deepcopy(original)
                                new.insert(i, paths[j])
                                allPaths.append(new)
            i += 1
        allPaths.append(path)
    return allPaths

def convertPaths(G, paths):
    """Converts the paths in terms of node indices to paths in terms of types

    Parameters
    ----------
    G : list
        The list of nodes representing the weighted solution graph
    paths : list
        The list of linearized paths from source to terminal of G
    """
    if type(paths) == int:
        n = getNode(paths, G)
        paths = n.type
    elif len(paths) == 1:
        for index in range(0, len(paths)):
            if type(paths[index]) == list:
                convertPaths(G, paths[index])
            else:
                n = getNode(paths[index], G)
                paths[index] = n.type
    else:
        for index in range(0, len(paths)):
            if type(paths[index]) == int:
                n = getNode(paths[index], G)
                paths[index] = n.type
            else:
                path = paths[index]
                for index in range(0, len(path)):
                    if type(path[index]) == list:
                        convertPaths(G, path[index])
                    else:
                        n = getNode(path[index], G)
                        path[index] = n.type

def getHint(solutionGraph, solutionWeights, studentGraph):
    """Compares the student submission to the weighted solutions in order to provide a suitable hint

    Parameters
    ----------
    solutionGraph : list
        The list of nodes representing the weighted solution graph
    solutionWeights : list
        The list of weights associated with the different paths through the solution graph
    studentGraph : list
        The list of nodes representing the weighted solution graph
    """
    weights = []
    paths = []
    paths = pathFinder(solutionGraph, 0, -1, paths, [])
    for path in paths:
        end = path[1]
        for edge in solutionWeights:
            if edge.start == 0 and edge.end == end:
                weights.append(edge.weight)
    solutions = genPaths(solutionGraph)
    student = genPaths(studentGraph)
    if len(student) > 1: return '!!! Hint generation abandoned due to branching !!!'
    else: student = genPaths(studentGraph)[0]
    # now we want to pick the path from solutions that is the most similar to student
    score = 0
    bestSolution = None
    largestIndex = 0
    for i in range(1, len(student)):
        for j in range(0, len(solutions)):
            if student[0:i] == solutions[j][0:i]:
                if i*weights[j] > score:
                    score = i*weights[j]
                    bestSolution = solutions[j]
                    largestIndex = i
    # traverse the best path while it matches student. When it stops matching, generate a hint.
    if len(student) > len(bestSolution):
        return 'It looks like your solution may be unnecessarily complicated... Double check your understanding of the problem.'
    if bestSolution[largestIndex] == 'basic':
        return 'Try creating some variables and/or assigning values to variables.'
    elif bestSolution[largestIndex] == 'loop':
        return 'Have you tried using a for loop or a while loop?'
    elif bestSolution[largestIndex] == 'branch':
        return 'Maybe some if/elif/else statements would be helpful...'
    elif bestSolution[largestIndex] == 'recursion':
        return 'Do you think recursion could be useful?'
    elif type(bestSolution[largestIndex]) == list:
        # identify what the logic is nested in:
        nest = bestSolution[largestIndex - 1]
        if len(student) <= largestIndex:
            # give first suggestion from list
            solutionList = bestSolution[largestIndex][0]
            while type(solutionList) == list:
                solutionList = solutionList[0]
            if solutionList == 'basic':
                return 'Try creating some variables and/or assigning values to variables.'
            elif solutionList == 'loop':
                return 'Have you tried using a for loop or a while loop?'
            elif solutionList == 'branch':
                return 'Maybe some if/elif/else statements would be helpful...'
            elif solutionList == 'recursion':
                return 'Do you think recursion could be useful?'
            else:
                return 'Your logic is on the right track, but it looks like your program still needs some work.'
        elif type(student[largestIndex]) != list:
            return 'Make sure you implement some logic inside your loop.'
        elif 'loop' in student[largestIndex] and 'loop' not in bestSolution[largestIndex]:
            return 'It looks like you may have used unecessary nested loops.'
        elif 'loop' in bestSolution[largestIndex] and 'loop' not in student[largestIndex]:
            return 'Consider using nested loops.'
        else:
            studentLoop = student[largestIndex]
            solutionLoop = bestSolution[largestIndex]
            for i in range(0, min(len(studentLoop), len(solutionLoop))):
                if studentLoop[i] != solutionLoop[i]:
                    if solutionLoop[i] == 'basic':
                        return 'Try creating some variables and/or assigning values to variables.'
                    elif solutionLoop[i] == 'loop':
                        return 'Have you tried using a for loop or a while loop?'
                    elif solutionLoop[i] == 'branch':
                        return 'Maybe some if/elif/else statements would be helpful...'
                    elif solutionLoop[i] == 'recursion':
                        return 'Do you think recursion could be useful?'
                    else:
                        return 'Your logic is on the right track, but it looks like your program still needs some work.'
            return 'It looks like you might need to implement some more logic inside of your loop.'
    else:
        return 'Your logic is on the right track, but it looks like your program still needs some work.'