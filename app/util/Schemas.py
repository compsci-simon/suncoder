from typing import List, Optional
from pydantic import BaseModel


class User(BaseModel):
    id: Optional[str]
    username: str
    type: str

    class Config:
        orm_mode = True


class Credentials(BaseModel):
    username: str
    password: str
    id: Optional[str]


class Password(BaseModel):
    password: str


class UserCode(BaseModel):
    id: str
    question_id: str
    user_id: str
    source: str
    versionId: int
    changes: list


class UserCodeTable(BaseModel):
    id: str
    question_id: str
    user_id: str
    source: str
    versionId: int
    changes: str


class CodeToRun(BaseModel):
    user_code_id: int
    user_code: str
    passes: int


class Example(BaseModel):
    input: str
    output: str
    explanation: str


class NameItem(BaseModel):
    name: str


class SampleSolution(BaseModel):
    id: Optional[str]
    source: str


class InputOutput(BaseModel):
    id: Optional[str]
    input: str
    output: str
    question_id: Optional[str]


class Question(BaseModel):
    id: str
    name: str
    description: str
    stdout: bool
    stderr: bool
    illegal_structures: List[NameItem]
    required_structures: List[NameItem]
    input_outputs: List[InputOutput]
    sample_solutions: List[SampleSolution]
    allowed_imports: List[NameItem]
    template: str
    categories: list
    operators: list
    calls: list
    linting: bool
    timeout: int

    class Config:
        orm_mode = True


class Unit(BaseModel):
    id: Optional[str]
    name: str
    categories: list
    pools: list


class QuestionStats(BaseModel):
    qid: int
    title: str
    attemps_and_passes: list


class CodeToRun(BaseModel):
    filename: str
    user: str
    image: str


class ExecutionOrder(BaseModel):
    question_id: str
    unit_id: str
    pool_id: str
    course_id: str


class keylogObject(BaseModel):
    uid: str
    qid: int
    language: str
    code: str
    keystrokes: list
    versionId: int


class shellCommand(BaseModel):
    command: str


class Course(BaseModel):
    id: str
    name: str
    prerequisites: list
    units: list


class Fragment(BaseModel):
    name: str


class Course_ID(BaseModel):
    id: str


class Code(BaseModel):
    source: str
    function: Optional[bool]


class ID_obj(BaseModel):
    uuid: str
