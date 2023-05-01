from http.client import HTTPException
import random
import uuid
from sqlalchemy import create_engine, desc
from typing import List, Tuple
import json
from app.util.Models import dynamic_table, Import, Pool, Code_Run, UserPoolQuestion, Sample, Structure, User, User_Code, Question, Course, Category, Unit, QuestionInputOutput, CoursePrerequisite, QuestionImport, RequiredStructure, IllegalStructure, UnitCategory, QuestionCategory, UnitPrerequisite, Enrolled, UserQuestionCompleted, Question, DATABASE_URI
from app.util import Schemas
from app.util import types
from sqlalchemy import inspect
import sys
import os
from sqlalchemy.orm import Session


def gen_id():
    return uuid.uuid4().hex


class Crud:
    def __init__(self):
        engine = create_engine(DATABASE_URI, pool_size=20,
                               max_overflow=20, pool_recycle=3600, pool_use_lifo=True)
        self.engine = engine

    # ------------------------------------ CREATE -------------------------------

    def create_general_list(self, tablename: str, object_list: any, session):
        try:
            _class = dynamic_table(tablename=tablename)
            primary_keys = _class.__table__.primary_key.columns.keys()
            col_names = list(map(lambda x: x.name, _class.__table__.columns))
            table_list = []
            # Creating the table list
            for obj in object_list:
                obj = dict(obj)
                # For each instance in the table list we first want to check if the
                # instance is in the database. If it is then we add that instance, else update
                named_args = {}
                for key in primary_keys:
                    if key in obj:
                        named_args[key] = obj[key]
                instance = session.query(
                    _class).filter_by(**named_args).first()
                if instance is not None:
                    table_list.append(instance)
                    continue
                instance = _class()
                for c in col_names:
                    if obj.get(c):
                        instance.__setattr__(c, obj.get(c))
                # Once all of the attributes have been set, we set all of the relationships
                # We are not creating relationships yet.
                session.add(instance)
                table_list.append(instance)
            session.commit()
            return table_list, None
        except Exception as e:
            return None, e

    def create_table(self, tablename: str, items: dict):
        with Session(self.engine) as session:
            instances = []
            _class = dynamic_table(tablename=tablename)
            db_instance = _class()
            col_names = list(map(lambda x: x.name, _class.__table__.columns))
            for item in items:
                item = dict(item)
                for attr in dir(_class):
                    if attr[0] != '_' and attr[-1] != '_' and attr != 'as_dict' and attr != 'metadata':
                        if attr not in col_names and attr in item:
                            db_instance.__getattribute__(attr).clear()
                            tablename = inspect(
                                Question).all_orm_descriptors[attr].prop.target.name
                            new_attr_value, err = self.create_general_list(
                                tablename, item[attr])
                            if err:
                                raise err
                            db_instance.__setattr__(attr, new_attr_value)
                        elif attr in item:
                            db_instance.__setattr__(
                                attr, item.get(attr))
                session.add(db_instance)
                session.commit()
                instances.append(db_instance.as_dict(1))
            return instances

    def create_questions(self, questions: List[Schemas.Question], user: types.User) -> Tuple[str, str]:
        """Creates a question and returns a (string, string) tuple. If the second string is None the transaction completed successfully"""
        with Session(self.engine) as session:
            try:
                created_questions = []
                for question in questions:
                    db_question = Question(
                        name=question.name,
                        description=question.description,
                        template=question.template,
                        stdout=question.stdout,
                        stderr=question.stderr,
                        timeout=question.timeout,
                        linting=question.linting,
                    )

                    session.add(db_question)
                    for category in question.categories:
                        cat = session.query(Category).filter_by(
                            name=category['name']).one()
                        db_question.categories.append(cat)
                    db_user = session.query(
                        User).filter(User.id == user.id).one()
                    db_question.creator = db_user
                    for input_output in question.input_outputs:
                        session.add(QuestionInputOutput(
                            input=input_output.input, output=input_output.output, question=db_question))
                    for sample in question.sample_solutions:
                        db_sample = Sample(source=sample.source)
                        db_question.sample_solutions.append(db_sample)
                        session.add(db_sample)
                    for imprt in question.allowed_imports:
                        db_allowed_import = session.query(
                            Import).filter(Import.name == imprt.name).one()
                        db_question.allowed_imports.append(db_allowed_import)
                    for structure in question.required_structures:
                        db_required_structure = session.query(
                            Structure).filter(Structure.name == structure.name).one()
                        db_question.required_structures.append(
                            db_required_structure)
                    for structure in question.illegal_structures:
                        db_illegal_structure = session.query(
                            Structure).filter(Structure.name == structure.name).one()
                        db_question.illegal_structures.append(
                            db_illegal_structure)

                    db_question.calls = question.calls
                    db_question.operators = question.operators
                    session.commit()
                    created_questions.append(db_question.as_dict())
                return created_questions, None
            except Exception as e:
                return None, str(e)

    def create_code_run(self, question_id: str, user: types.User, flagged: bool, runtime: int, cases_passed: int, total_cases: int, start_version: int, end_version: int) -> Tuple[str, str]:
        """Used to create a log of every time a user runs code"""
        with Session(self.engine) as session:
            try:
                user_code = session.query(User_Code).filter(
                    User_Code.user_id == user.id, User_Code.question_id == question_id).one()
                print('runtime', runtime)
                code_run = Code_Run(
                    user_code_id=user_code.id,
                    cases_passed=cases_passed,
                    total_cases=total_cases,
                    flagged=flagged,
                    runtime=runtime,
                    start_version=start_version,
                    end_version=end_version
                )
                session.add(code_run)
                session.commit()
                return code_run.as_dict(), None
            except Exception as e:
                return None, str(e)

    def create_courses(self, courses: Schemas.Course) -> str:
        """This method is used to create a course"""
        with Session(self.engine) as session:
            db_courses = []
            for course in courses:
                if session.query(Course).filter_by(name=course.name).first() is not None:
                    continue
                db_course = Course(name=course.name)
                session.add(db_course)
                for prerequisite in course.prerequisites:
                    c = session.query(Course).filter_by(
                        name=prerequisite['name']).one()
                    db_course.prerequisites.append(c)
                for unit in course.units:
                    courseUnit = session.query(
                        Unit).filter_by(id=unit['id']).one()
                    for prereq in unit['prerequisites']:
                        prerequisitesUnit = session.query(
                            Unit).filter_by(id=prereq['id']).one()
                        courseUnit.prerequisites.append(prerequisitesUnit)
                    db_course.units.append(courseUnit)
                session.commit()
                db_courses.append(db_course.as_dict())
            return db_courses

    def create_unit(self, unit: Schemas.Unit) -> Tuple[str, str]:
        '''Used to create a unit'''
        with Session(self.engine) as session:
            try:
                db_unit = Unit(id=gen_id(), name=unit.name)
                session.add(db_unit)
                for category in unit.categories:
                    cat = session.query(Category).filter(
                        Category.name == category['name']).one()
                    db_unit.categories.append(cat)
                for pool in unit.pools:
                    old_id = pool['id']
                    pool['id'] = gen_id()
                    for pul in unit.pools:
                        for prereq in pul['prerequisites']:
                            if prereq['id'] == old_id:
                                prereq['id'] = pool['id']
                db_pools = []
                for num, pool in enumerate(unit.pools):
                    db_pool = Pool(id=pool['id'], poolnum=num,
                                   unit_id=db_unit.id)
                    for question in pool['questions']:
                        q = session.query(Question).filter(
                            Question.id == question['id']).one()
                        db_pool.questions.append(q)
                    db_unit.pools.append(db_pool)
                    db_pools.append(db_pool)
                    session.add(db_pool)
                session.commit()
                for index, pool in enumerate(unit.pools):
                    for prereq in pool['prerequisites']:
                        prereq_pool = session.query(Pool).filter_by(
                            id=prereq['id']).one()
                        db_pools[index].prerequisites.append(prereq_pool)
                session.commit()
                id = db_unit.id
                db_unit = session.query(
                    Unit).filter(Unit.id == id).one()
                return db_unit.as_dict(recursion_level=2), None
            except Exception as e:
                return None, str(e)

    def question_completed(self, user: types.User, qid: int) -> Tuple[str, str]:
        '''Once a user has completed a question it is recorded that they have passed that question'''
        try:
            user_db = self.session.query(User).filter(User.id == user.id).one()
            question_db = self.session.query(
                Question).filter(Question.id == qid).one()
            if not question_db in user_db.questions_completed:
                user_db.questions_completed.append(question_db)
            self.session.commit()
            return 'Successfully added question to user\'s completed questions', None
        except Exception as e:
            return None, str(e)

    def unit_completed(self, user: types.User) -> Tuple[str, str]:
        '''When a user completes a question, we want to also check if any units are now also completed by the user'''
        try:
            return '', None
        except Exception as e:
            return None, str(e)

    def create_structure(self, strucure_name) -> Tuple[str, str]:
        '''Used to create an import'''
        try:
            db_structure = Structure(name=strucure_name)
            self.session.add(db_structure)
            self.session.commit()
            return 'Succesfully created structure', None
        except Exception as e:
            return None, str(e)

    def create_demo_user(self):
        '''Used to create a demo user'''
        with Session(self.engine) as session:
            user = User(id=uuid.uuid4().hex,
                        username='demo',
                        password='12345678',
                        type='lecturer')
            session.add(user)
            session.commit()
            return {'id': user.id, 'username': 'demo', 'type': 'lecturer'}
    # ------------------------------------ READ ---------------------------------

    def get_table(self, table, extra_args=None) -> Tuple[list, str]:
        '''Generic method to dynamically get specified table'''
        with Session(self.engine) as session:
            if extra_args is not None:
                return session.query(dynamic_table(table)).filter_by(**extra_args).all()
            else:
                return session.query(dynamic_table(table)).all()

    def get_user_type(self, id: str) -> Tuple[str, str]:
        '''Used to get the type of user, once a user has logged in'''
        try:
            return self.session.query(User).filter_by(id=id).one().type, None
        except Exception as e:
            return None, str(e)

    def authenticate_user(self, username: str, password: str) -> bool:
        '''When a user attempts to log in, this method is called to authenticate the user'''
        with Session(self.engine) as session:
            user = session.query(User)\
                .filter(User.username == username, User.password == password).first()
            return {'id': user.id, 'username': username, 'type': user.type}

    def get_user(self, username: str) -> User:
        '''This method is used to get a user given as username. It is used within dependency injection to inject the user and especially the type of user when securing routes'''
        with Session(self.engine) as session:
            try:
                return session.query(User).filter(User.username == username).first()
            except Exception:
                return None

    def get_question_stats(self, qid: int) -> Tuple[str, str]:
        """Used to get the stats of a question for the admin overview"""
        try:
            question = self.session.query(Question).filter(
                Question.id == qid).first()
            results = self.session.query(User_Code).filter(
                User_Code.question_id == qid).all()
            stats = []
            for result in results:
                code_runs = result.code_runs
                attempts = len(code_runs)
                passed = 0
                runtime = 5000
                for run in code_runs:
                    passed = run.passes
                    runtime = run.runtime
                stats.append({
                    "id": result.id,
                    "username": result.user.username,
                    "attempts": attempts,
                    "passed": passed,
                    "runtime": runtime
                })
            return {"question": question, "stats": stats}, None
        except Exception as e:
            return None, str(e)

    def get_users(self):
        """Mainly used for testing purposes to create multiple users"""
        try:
            users = self.session.query(User).all()
            return users, None
        except Exception as e:
            return None, str(e)

    def get_num_keystrokes(self, id: int) -> Tuple[str, str]:
        """Used for testing how quickly the size of the database grows. In particular how quickly does the table grow in relation to the number of keystrokes. Gets the number of keystrokes for a user_code entry."""
        try:
            user_code = self.session.query(
                User_Code).filter(User_Code.id == id).first()
            keystrokes = json.loads(user_code.keystrokes)
            return len(keystrokes), None
        except Exception as e:
            return None, str(e)

    def user_code_for_execution(self, question_id: str, user_id: str) -> Tuple[dict, str]:
        with Session(self.engine) as session:
            try:
                db_user_code = session.query(User_Code.id, User_Code.source, User_Code.versionId).filter(
                    User_Code.user_id == user_id, User_Code.question_id == question_id).first()
                if not db_user_code:
                    db_question = session.query(
                        Question).filter_by(id=question_id).one()
                    db_user_code = User_Code(
                        user_id=user_id,
                        question_id=question_id,
                        language='Python',
                        source=db_question.template,
                        changes=json.dumps([])
                    )
                    session.add(db_user_code)
                    session.commit()
                user_code = {
                    'source': db_user_code.source,
                    'versionId': db_user_code.versionId,
                }
                db_code_runs = session.query(Code_Run).filter(
                    Code_Run.user_code_id == db_user_code.id).order_by(Code_Run.end_version).all()
                if len(db_code_runs) == 0:
                    user_code['start_version'] = 0
                else:
                    user_code['start_version'] = db_code_runs[-1].end_version
                return user_code, None
            except Exception as e:
                return None, str(e)

    def get_user_code_instance(self, user_code_id: str) -> Tuple[dict, str]:
        '''Used to get the a specific instance of user code'''
        with Session(self.engine) as session:
            try:
                return session.query(User_Code).filter(User_Code.id == user_code_id).one(), None
            except Exception as e:
                return None, str(e)

    def get_user_code_runs(self, user_code_id) -> Tuple[dict, str]:
        '''Used to get all code runs for a particular user code'''
        with Session(self.engine) as session:
            try:
                db_user_code = session.query(User_Code).filter(
                    User_Code.id == user_code_id).one()
                return db_user_code.code_runs, None
            except Exception as e:
                return None, str(e)

    def get_code_id(self, executionOrder: Schemas.ExecutionOrder) -> int:
        """Used to get the User_Code.id"""
        user_code = self.session.query(User_Code).filter(User_Code.user_id == executionOrder.uid,
                                                         User_Code.question_id == executionOrder.qid, User_Code.language == executionOrder.language).first()
        if user_code == None:
            return None
        return user_code.id

    def get_code_runs(self, question_id) -> Tuple[dict, str]:
        '''This method is used to get all the code runs of a particular user. This is used in the /stats/question page'''
        try:
            code_runs = []
            db_question = self.session.query(
                Question).filter(Question.id == question_id)
            for db_user_code in db_question.user_code_instances:
                for db_code_run in db_user_code.code_runs:
                    code_runs.append(db_code_run.as_dict())
            return code_runs, None
        except Exception as e:
            return None, str(e)

    def get_course(self, courseId: str) -> Tuple[str, str]:
        '''Get the course information for a singular course. If a user wants to edit the course then we need this information'''
        try:
            course = self.session.query(Course).filter(
                Course.id == courseId).one()
            course.units
            for unit in course.units:
                unit.prerequisites
            course.prerequisites
            return course, None
        except Exception as e:
            return None, str(e)

    def get_user_info(self, username: str) -> Tuple[str, str]:
        '''Used to get the user type and id once a user has signed in'''
        try:
            user = self.session.query(User).filter(
                User.username == username).one()
            return user, None
        except Exception as e:
            return None, str(e)

    def get_question_data(self, question_id: str) -> Tuple[dict, str]:
        '''Used to get the data needed to create a question runner'''
        with Session(self.engine) as session:
            try:
                db_question = session.query(
                    Question).filter(Question.id == question_id).one()
                return db_question.as_dict(), None
            except Exception as e:
                return None, str(e)

    # def get_code_run_instance(self, id) -> Tuple[dict, str]:
    #     '''Used to get an specific instance of a code run'''
    #     try:
    #         return self.session.query(Code_Run).filter(Code_Run.id == id).one(), None
    #     except Exception as e:
    #         return None, str(e)

    def get_user_unit_pool_questions(self, unit_id: str, user: types.User) -> Tuple[dict, str]:
        '''Used to get all the questions that should be displayed for a particular user and pool combination'''
        with Session(self.engine) as session:
            try:
                rows = []
                db_unit = session.query(Unit).filter_by(id=unit_id).one()
                for db_pool in db_unit.pools:
                    query = session.query(UserPoolQuestion).filter_by(
                        toPoolId=db_pool.id, fromUserId=user.id)
                    if query.count() == 0:
                        question = random.choice(db_pool.questions)
                        uuid = gen_id()
                        db_userPoolQuestion = UserPoolQuestion(
                            id=uuid, fromUserId=user.id, toPoolId=db_pool.id, question_id=question.id)
                        session.add(db_userPoolQuestion)
                        session.commit()
                        rows.append(session.query(
                            UserPoolQuestion).filter_by(id=uuid).one().as_dict())
                    else:
                        for item in query.all():
                            rows.append(item)
                return rows, None
            except Exception as e:
                return None, str(e)

    # ------------------------------------ UPDATE -------------------------------

    def update_question(self, question: Schemas.Question) -> Tuple[dict, str]:
        """Used to update a question and it's examples"""
        with Session(self.engine) as session:
            try:
                question = dict(question)
                db_question = session.query(
                    Question).filter_by(id=question['id']).one()
                col_names = list(
                    map(lambda x: x.name, Question.__table__.columns))
                for attr in dir(Question):
                    if attr[0] != '_' and attr != 'as_dict':
                        if attr not in col_names and attr in question:
                            db_question.__getattribute__(attr).clear()
                            tablename = inspect(
                                Question).all_orm_descriptors[attr].prop.target.name
                            new_attr_value, err = self.create_general_list(
                                tablename, question[attr], session)
                            if err:
                                raise HTTPException(500, str(err))
                            db_question.__setattr__(attr, new_attr_value)
                        elif attr in question:
                            db_question.__setattr__(
                                attr, question.__getitem__(attr))
                session.commit()
                return db_question.as_dict(1), None
            except Exception as e:
                exc_type, exc_obj, exc_tb = sys.exc_info()
                fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
                return None, {'fname': fname, 'exc_tb.tb_lineno': exc_tb.tb_lineno, 'error': str(e), 'attr': attr}

    def update_course(self, course: Schemas.Course) -> Tuple[dict, str]:
        '''Used when updating course information'''
        with Session(self.engine) as session:
            try:
                # course = dict(course)
                db_course = session.query(Course).filter_by(
                    id=course.id).one()
                db_course.name = course.name
                for unit in db_course.units:
                    unit.prerequisites = []
                    unit.course = None
                db_course.units = []
                for unit in course.units:
                    db_unit = session.query(
                        Unit).filter_by(id=unit['id']).one()
                    db_unit.prerequisites = []
                    for prereq in unit['prerequisites']:
                        db_prereq_unit = session.query(
                            Unit).filter_by(id=prereq['id']).one()
                        db_unit.prerequisites.append(db_prereq_unit)
                    db_course.units.append(db_unit)
                db_course.prerequisites = []
                for prerequisite in course.prerequisites:
                    prereq = session.query(Course).filter_by(
                        id=prerequisite['id']).one()
                    db_course.prerequisites.append(prereq)
                obj = db_course.as_dict(recursion_level=2)
                session.commit()
                return obj, None
            except Exception as e:
                return None, str(e)

    def update_unit(self, unit: Schemas.Unit) -> Tuple[str, str]:
        '''This method is used to update a unit'''
        with Session(self.engine) as session:
            try:
                unit.pools.sort(key=lambda p: p['poolnum'])
                db_unit = session.query(Unit).filter_by(id=unit.id).one()
                db_unit.name = unit.name
                db_unit.categories = []
                for category in unit.categories:
                    cat = session.query(Category).filter(
                        Category.name == category['name']).first()
                    db_unit.categories.append(cat)
                for db_pool in db_unit.pools:
                    session.delete(db_pool)
                for pool in unit.pools:
                    old_id = pool['id']
                    pool['id'] = gen_id()
                    for pul in unit.pools:
                        for prereq in pul['prerequisites']:
                            if prereq['id'] == old_id:
                                prereq['id'] = pool['id']
                db_pools = []
                for pool in unit.pools:
                    db_pool = Pool(id=pool['id'], poolnum=pool['poolnum'],
                                   unit_id=unit.id)
                    for question in pool['questions']:
                        q = session.query(Question).filter_by(
                            id=question['id']).one()
                        db_pool.questions.append(q)
                    db_unit.pools.append(db_pool)
                    db_pools.append(db_pool)
                    session.add(db_pool)
                session.commit()
                for index, pool in enumerate(unit.pools):
                    for prereq in pool['prerequisites']:
                        prereq_pool = session.query(Pool).filter_by(
                            id=prereq['id']).one()
                        db_pools[index].prerequisites.append(prereq_pool)
                session.commit()
                db_unit = session.query(Unit).filter_by(id=unit.id).one()
                return db_unit.as_dict(recursion_level=2), None
            except Exception as e:
                return None, str(e)

    def enroll_user(self, course_id: str, user: types.User) -> Tuple[str, str]:
        """Used to add a user to a course"""
        with Session(self.engine) as session:
            try:
                db_user = session.query(
                    User).filter_by(id=user.id).one()
                db_course = session.query(
                    Course).filter_by(id=course_id).one()
                db_user.enrolled_courses.append(db_course)
                session.commit()
                return "Successfully enrolled user in course", None
            except Exception as e:
                return None, str(e)

    def change_password(self, password: str, user: types.User) -> bool:
        with Session(self.engine) as session:
            user = session.query(User).filter(User.id == user.id).first()
            user.password = password
            session.commit()
            return True

    def save_user_code(self, user_code) -> Tuple[str, str]:
        '''This method is used to take a user code table from the front end cache and recreate the table in the backend'''
        with Session(self.engine) as session:
            try:
                user_code = dict(user_code)
                col_names = map(lambda x: x.name, User_Code.__table__.columns)
                count = session.query(User_Code).filter_by(
                    id=user_code['id']).count()
                if count == 0:
                    db_user_code = User_Code()
                    for col in col_names:
                        db_user_code.__setattr__(col, user_code.get(col))
                    session.add(db_user_code)
                    session.commit()
                    return session.query(User_Code).filter(User_Code.id == db_user_code.id).one(), None
                elif count == 1:
                    db_user_code = session.query(
                        User_Code).filter_by(id=user_code.get('id')).one()
                    for col in col_names:
                        db_user_code.__setattr__(col, user_code.get(col))
                    session.commit()
                    return db_user_code.as_dict(), None
                else:
                    return None, f'One row was expected but found {count}'
            except Exception as e:
                return None, str(e)

    def upsert_question_status(self, user: types.User, question_id: str) -> Tuple[dict, str]:
        '''Whenever a user receives full marks for a question an entry is made to record that the user has completed that question. This method performs that function'''
        with Session(self.engine) as session:
            try:
                db_userQuestionCompleted = session.query(UserQuestionCompleted).filter(
                    UserQuestionCompleted.fromUserId == user.id, UserQuestionCompleted.toQuestionId == question_id).first()
                db_user_code = session.query(User_Code).filter(
                    User_Code.user_id == user.id, User_Code.question_id == question_id).one()
                db_most_recent_run = session.query(Code_Run).filter(
                    Code_Run.user_code_id == db_user_code.id).order_by(desc(Code_Run.date)).first()
                if db_userQuestionCompleted is not None:
                    if db_most_recent_run.cases_passed != db_most_recent_run.total_cases:
                        session.delete(db_userQuestionCompleted)
                        session.commit()
                        return None, None
                    else:
                        return db_userQuestionCompleted.as_dict(), None
                else:
                    if db_most_recent_run.cases_passed == db_most_recent_run.total_cases:
                        item = UserQuestionCompleted(
                            fromUserId=user.id, toQuestionId=question_id)
                        session.add(item)
                        session.commit()
                        return session.query(UserQuestionCompleted).filter(UserQuestionCompleted.id == item.id).one().as_dict(), None
                    else:
                        return None, None
            except Exception as e:
                return None, str(e)

    # ------------------------------------ DELETE -------------------------------

    def delete_objects(self, tablename: str, pk_list: List[dict]):
        '''
        Deletes the from the given table, all objects with an id in the found in the list

            Parameters:
                tablename (str): The table which contains the objects who's id's are in the id_list
                id_list (list[str]): The list which contains the objects id's that are going to be deleted

            Return:
                void

            Throws:
                If the given table does not exist or an id is given that does not exist in the table
        '''
        with Session(self.engine) as session:
            try:
                _class = dynamic_table(tablename)
                primary_keys = _class.__table__.primary_key.columns.keys()
                for pk in pk_list:
                    named_args = {}
                    for key in primary_keys:
                        if key in pk:
                            named_args[key] = pk[key]
                    instance = session.query(
                        _class).filter_by(**named_args).one()
                    session.delete(instance)
                session.commit()
            except Exception as e:
                session.rollback()
                raise e

    def delete_questions(self, questions: list) -> Tuple[str, str]:
        '''Used to delete multiple questions'''
        try:
            for questionId in questions:
                q = self.session.query(Question).filter(
                    Question.id == questionId).first()
                self.session.delete(q)
            self.session.commit()
            return "Successfully delete all questions", None
        except Exception as e:
            return None, str(e)

    def delete_units(self, units: list) -> Tuple[str, str]:
        '''Used to delete multiple units'''
        try:
            for unitId in units:
                u = self.session.query(Unit).filter(Unit.id == unitId).first()
                self.session.delete(u)
            self.session.commit()
            return 'Successfully deleted specified units', None
        except Exception as e:
            return None, str(e)

    def delete_courses(self, courseIds: list) -> Tuple[str, str]:
        '''Used to delete courses from the data grid'''
        try:
            for id in courseIds:
                db_course = self.session.query(
                    Course).filter(Course.id == id).one()
                for unit in db_course.units:
                    unit.prerequisites = []
                self.session.delete(db_course)
            self.session.commit()
            return "Successfully deleted courses", None
        except Exception as e:
            return None, str(e)

    def delete_users(self, user_ids: list) -> Tuple[str, str]:
        '''Used to delete a list of users'''
        try:
            for id in user_ids:
                user = self.session.query(User).filter(User.id == id).first()
                self.session.delete(user)
            self.session.commit()
            return "Successfully deleted users", None
        except Exception as e:
            return None, str(e)
