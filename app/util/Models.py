import datetime
from sqlalchemy import create_engine, ForeignKey, Column, Integer, String, Text, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, registry
import os
import uuid

DB_USERNAME = os.environ.get('DB_USERNAME') if os.environ.get(
    'DB_USERNAME') else 'root'
DB_PASSWORD = os.environ.get('DB_PASSWORD') if os.environ.get(
    'DB_PASSWORD') else 'mypass'
DB_URI = os.environ.get('DB_URI') if os.environ.get('DB_URI') else 'localhost'
DB_PORT = os.environ.get('DB_PORT') if os.environ.get('DB_PORT') else 3306
DATABASE_URI = f"mysql+pymysql://{DB_USERNAME}:{DB_PASSWORD}@{DB_URI}:{DB_PORT}/suncoder"

mapper_registry = registry()
Base = mapper_registry.generate_base()
# Base = declarative_base()
STRING_LEN_CONST = 1000


def random_string():
    return uuid.uuid4().hex


class CoursePrerequisite(Base):
    __tablename__ = 'course_prerequisites'
    id = Column(String(32), primary_key=True, default=random_string)
    fromCourseId = Column(String(32), ForeignKey('courses.id', ondelete='CASCADE'))
    toCourseId = Column(String(32), ForeignKey('courses.id', ondelete='CASCADE'))

    def as_dict(self, recursion_level=1):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self):
        return f"<CoursePrerequisite(id={self.id}, fromCourseId={self.fromCourseId}, toCourseId={self.toCourseId})>"


class Course(Base):
    __tablename__ = 'courses'
    id = Column(String(32), primary_key=True, default=random_string)
    name = Column(String(100), primary_key=True)
    units = relationship('Unit', backref='course')
    prerequisites = relationship(
        'Course',
        secondary=CoursePrerequisite.__table__,
        primaryjoin=id == CoursePrerequisite.__table__.c.toCourseId,
        secondaryjoin=id == CoursePrerequisite.__table__.c.fromCourseId,
        backref='prerequisite_to'
    )

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        if recursion_level > 0:
            item_to_return['units'] = [item.as_dict(
                recursion_level - 1) for item in self.units]
            item_to_return['prerequisites'] = [
                item.id for item in self.prerequisites]
        return item_to_return

    def __repr__(self):
        return f"<Course(id={self.id}, name={self.name}, units={self.units}, prerequisites={self.prerequisites})>"


class UnitPrerequisite(Base):
    __tablename__ = 'unit_prerequisites'
    id = Column(String(32), primary_key=True, default=random_string)
    fromUnitId = Column(String(32), ForeignKey('units.id'))
    toUnitId = Column(String(32), ForeignKey('units.id'))

    def as_dict(self, recursion_level=1):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self):
        return f"<UnitPrerequisite(id={self.id}, fromUnitId={self.fromUnitId}, toUnitId={self.toUnitId})>"


class PoolQuestion(Base):
    __tablename__ = 'pool_questions'
    id = Column(String(32), primary_key=True, default=random_string)
    fromPoolId = Column(String(32), ForeignKey('pools.id'))
    toQuestionId = Column(String(32), ForeignKey('questions.id'))

    def as_dict(self, recursion_level=1):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self):
        return f"<PoolQuestion(id={self.id}, fromPoolId={self.fromPoolId}, toQuestionId={self.toQuestionId})>"


class UnitCategory(Base):
    __tablename__ = 'unit_categories'
    fromUnitId = Column(String(32), ForeignKey('units.id', ondelete='CASCADE'), primary_key=True)
    toCategoryId = Column(String(100), ForeignKey(
        'categories.name', ondelete='CASCADE'), primary_key=True)

    def as_dict(self, recursion_level=1):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self):
        return f"<Category(question_id={self.fromUnitId}, category={self.toCategoryId})>"


class UserQuestionCompleted(Base):
    __tablename__ = 'questions_completed'
    id = Column(String(32), primary_key=True, default=random_string)
    fromUserId = Column(String(32), ForeignKey('users.id', ondelete='CASCADE'))
    toQuestionId = Column(String(32), ForeignKey('questions.id', ondelete='CASCADE'))

    def __repr__(self):
        return f'<UserQuestionCompleted(fromUserId={self.fromUserId}, toQuestionId={self.toQuestionId})>'

    def as_dict(self, recursion_level=1):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class PoolPrerequisites(Base):
    __tablename__ = 'pool_prerequisites'
    id = Column(String(32), primary_key=True, default=random_string)
    fromPoolId = Column(String(32), ForeignKey('pools.id'))
    toPoolId = Column(String(32), ForeignKey('pools.id'))

    def __repr__(self):
        return f'<PoolPrerequisites(id={self.id}, fromfromPoolIdUserId={self.fromPoolId}, toPoolId={self.toPoolId})>'

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}
        return item_to_return


class UserPoolQuestion(Base):
    __tablename__ = 'user_pool_questions'
    id = Column(String(32), primary_key=True, default=random_string)
    fromUserId = Column(String(32), ForeignKey('users.id'), nullable=False)
    toPoolId = Column(String(32), ForeignKey('pools.id'), nullable=False)
    question_id = Column(String(32), ForeignKey(
        'questions.id'), nullable=False)

    def __repr__(self):
        return f'<UserPoolQuestion(id={self.id}, fromUserId={self.fromUserId}, toPoolId={self.toPoolId}, question_id={self.question_id})>'

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}
        return item_to_return


class Pool(Base):
    __tablename__ = 'pools'
    id = Column(String(32), primary_key=True, default=random_string)
    poolnum = Column(Integer, nullable=False)
    unit_id = Column(String(32), ForeignKey('units.id'), nullable=False)
    questions = relationship(
        'Question', secondary=PoolQuestion.__table__, backref='pools')
    prerequisites = relationship(
        'Pool',
        secondary=PoolPrerequisites.__table__,
        primaryjoin=id == PoolPrerequisites.__table__.c.toPoolId,
        secondaryjoin=id == PoolPrerequisites.__table__.c.fromPoolId,
        backref='prerequisite_to',
    )
    user_question = relationship(
        'User', secondary=UserPoolQuestion.__table__, backref='user_pool_question')

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        if recursion_level > 0:
            item_to_return['questions'] = [item.id for item in self.questions]
            item_to_return['prerequisites'] = [
                item.id for item in self.prerequisites]
        return item_to_return

    def __repr__(self):
        return f'<Pool(id={self.id}, poolnum={self.poolnum}, unit_id={self.unit_id})>'


class Unit(Base):
    __tablename__ = 'units'
    id = Column(String(32), primary_key=True, default=random_string)
    name = Column(String(100))
    categories = relationship(
        'Category', secondary=UnitCategory.__table__, backref='units')
    prerequisites = relationship(
        'Unit',
        secondary=UnitPrerequisite.__table__,
        primaryjoin=id == UnitPrerequisite.__table__.c.fromUnitId,
        secondaryjoin=id == UnitPrerequisite.__table__.c.toUnitId,
        backref='prerequisite_to'
    )
    pools = relationship('Pool', backref='unit', cascade="all, delete-orphan")
    course_id = Column(String(32), ForeignKey('courses.id'))

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        if recursion_level > 0:
            item_to_return['pools'] = [item.as_dict(
                recursion_level - 1) for item in self.pools]
            item_to_return['categories'] = [item.as_dict(
                recursion_level - 1) for item in self.categories]
            item_to_return['prerequisites'] = [
                item.id for item in self.prerequisites]
        return item_to_return

    def __repr__(self):
        return f'<Unit(id={self.id}, name={self.name})>'


class Enrolled(Base):
    __tablename__ = 'enrolled'
    id = Column(String(32), primary_key=True, default=random_string)
    fromUserId = Column(String(32), ForeignKey('users.id', ondelete='CASCADE'))
    toCourseId = Column(String(32), ForeignKey('courses.id', ondelete='CASCADE'))

    def as_dict(self, recursion_level=1):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self):
        return f'<Enrolled(id={self.id}, fromUserId={self.fromUserId}, toCourseId={self.toCourseId})>'


class User(Base):
    __tablename__ = 'users'
    id = Column(String(32), primary_key=True, default=random_string)
    username = Column(String(32))
    password = Column(String(32))
    type = Column(String(32))
    code = relationship('User_Code', backref='user',
                        cascade="all, delete-orphan")
    enrolled_courses = relationship(
        'Course', secondary=Enrolled.__table__, backref='enrolled_users')
    questions_completed = relationship(
        'Question', secondary=UserQuestionCompleted.__table__, backref='users_completed')

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        if recursion_level > 0:
            item_to_return['code'] = [item.as_dict(
                recursion_level - 1) for item in self.code]
            item_to_return['enrolled_courses'] = [item.as_dict(
                recursion_level - 1) for item in self.enrolled_courses]
            item_to_return['questions_completed'] = [item.as_dict(
                recursion_level - 1) for item in self.questions_completed]

        return item_to_return

    def __repr__(self):
        return f"<Category(id={self.id}, username={self.username})>"


class QuestionCategory(Base):
    __tablename__ = 'question_categories'
    id = Column(String(32), primary_key=True, default=random_string)
    fromQuestionId = Column(String(32), ForeignKey('questions.id', ondelete='CASCADE'))
    toCategoryId = Column(String(100), ForeignKey(
        'categories.name', ondelete='CASCADE'))

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f'<QuestionCategory(id={self.id}, fromQuestionId={self.fromQuestionId}, toCategoryId={self.toCategoryId})>'


class QuestionImport(Base):
    __tablename__ = 'allowed_imports'
    id = Column(String(32), primary_key=True, default=random_string)
    fromQuestionId = Column(String(32), ForeignKey('questions.id', ondelete='CASCADE'))
    toImportId = Column(String(100), ForeignKey(
        'imports.name', ondelete='CASCADE'))

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f'<QuestionImport(id={self.id}, fromQuestionId={self.fromQuestionId}, toImportId={self.toImportId})>'


class Structure(Base):
    __tablename__ = 'structures'
    name = Column(String(100), primary_key=True)

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f'<Structure(name={self.name})>'


class RequiredStructure(Base):
    __tablename__ = 'required_structures'
    id = Column(String(32), primary_key=True, default=random_string)
    fromQuestionId = Column(String(32), ForeignKey(
        'questions.id', ondelete='CASCADE'))
    toStructureId = Column(String(100), ForeignKey(
        'structures.name', ondelete='CASCADE'))

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f'<RequiredStructure(id={self.id}, fromQuestionId={self.fromQuestionId}, toStructureId={self.toStructureId})>'


class IllegalStructure(Base):
    __tablename__ = 'illegal_structures'
    id = Column(String(32), primary_key=True, default=random_string)
    fromQuestionId = Column(String(32), ForeignKey(
        'questions.id', ondelete='CASCADE'))
    toStructureId = Column(String(100), ForeignKey(
        'structures.name', ondelete='CASCADE'))

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f'<IllegalStructure(id={self.id}, fromQuestionId={self.fromQuestionId}, toStructureId={self.toStructureId})>'


class Question(Base):
    __tablename__ = 'questions'
    id = Column(String(32), primary_key=True, default=random_string)
    name = Column(String(100), unique=True)
    description = Column(String(10000))
    template = Column(Text)
    stdout = Column(Boolean, default=False)
    stderr = Column(Boolean, default=False)
    input_outputs = relationship(
        'QuestionInputOutput', backref='question',
        order_by="desc(app.util.Models.QuestionInputOutput.input)",
        cascade='all, delete-orphan'
    )
    categories = relationship(
        'Category', secondary=QuestionCategory.__table__, backref='question')
    creator_id = Column(String(32), ForeignKey('users.id'))
    creator = relationship('User')
    difficulty = Column(String(100))
    allowed_imports = relationship(
        'Import', secondary=QuestionImport.__table__, backref='questions')
    required_structures = relationship(
        'Structure', secondary=RequiredStructure.__table__, backref='required_for')
    illegal_structures = relationship(
        'Structure', secondary=IllegalStructure.__table__, backref='illegal_for')
    user_code_instances = relationship(
        'User_Code', cascade='all, delete-orphan', backref='question')
    sample_solutions = relationship(
        'Sample', backref='question', cascade='all, delete-orphan')
    operators = Column(JSON(1000))
    calls = Column(JSON(1000))
    timeout = Column(Integer)
    linting = Column(Boolean)

    def as_dict(self, recursive_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        if recursive_level > 0:
            if self.input_outputs:
                item_to_return['input_outputs'] = [item.as_dict(
                    recursive_level - 1) for item in self.input_outputs]
            else:
                item_to_return['input_outputs'] = []
            if self.categories:
                item_to_return['categories'] = [
                    category.name for category in self.categories]
            else:
                item_to_return['categories'] = []
            if self.creator:
                item_to_return['creator'] = self.creator.as_dict(
                    recursive_level - 1)
            if self.allowed_imports:
                item_to_return['allowed_imports'] = [
                    imprt.name for imprt in self.allowed_imports]
            else:
                item_to_return['allowed_imports'] = []
            if self.required_structures:
                item_to_return['required_structures'] = [
                    struct.name for struct in self.required_structures]
            else:
                item_to_return['required_structures'] = []
            if self.illegal_structures:
                item_to_return['illegal_structures'] = [
                    struct.name for struct in self.illegal_structures]
            else:
                item_to_return['illegal_structures'] = []
            if self.user_code_instances:
                item_to_return['user_code_instance'] = [
                    instance.id for instance in self.user_code_instances]
            else:
                item_to_return['user_code_instance'] = []
            if self.sample_solutions:
                item_to_return['sample_solutions'] = [instance.as_dict(
                    recursive_level - 1) for instance in self.sample_solutions]
            else:
                item_to_return['sample_solutions'] = []

        return item_to_return

    def __repr__(self):
        return f'''<Question(id='{self.id}',
            name='{self.name}',
            description='{self.description}',
            template={self.template},
            categories={self.categories},
            creator_id={self.creator_id},
            creator={self.creator},
            difficulty={self.difficulty},
            allowed_imports={self.allowed_imports},
            required_structures={self.required_structures},
            illegal_structures={self.illegal_structures},
            user_code_instances={self.user_code_instances},
            sample_solutions={self.sample_solutions})>'''


class QuestionInputOutput(Base):
    __tablename__ = 'input_output'
    id = Column(String(32), primary_key=True, default=random_string)
    question_id = Column(String(32), ForeignKey(
        'questions.id', ondelete='CASCADE'))
    input = Column(String(1000))
    output = Column(String(1000))

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f'<QuestionInputOutput(id={self.id}, question_id={self.question_id}, input={self.input}, output={self.output})>'


class Sample(Base):
    __tablename__ = 'samples'
    id = Column(String(32), primary_key=True, default=random_string)
    question_id = Column(String(32), ForeignKey('questions.id'))
    source = Column(String(STRING_LEN_CONST))

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f'<Sample(question_id={self.question_id}, source={self.source})>'


class Import(Base):
    __tablename__ = 'imports'
    name = Column(String(100), primary_key=True)

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f'<Import(name={self.name})>'


class Category(Base):
    __tablename__ = 'categories'
    name = Column(String(100), primary_key=True)

    def as_dict(self, recusion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f"<Category(name={self.name})>"


class User_Code(Base):
    __tablename__ = 'user_code'
    id = Column(String(32), primary_key=True, default=random_string)
    user_id = Column(String(32), ForeignKey('users.id'))
    question_id = Column(String(32), ForeignKey('questions.id'))
    language = Column(String(45), default='Python')
    source = Column(Text(4294000000))
    changes = Column(Text(4294000000))
    versionId = Column(Integer, default=1)
    code_runs = relationship(
        'Code_Run', backref='user_code', cascade="all, delete-orphan")

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        if recursion_level > 0:
            item_to_return['code_runs'] = [item.as_dict(
                recursion_level - 1) for item in self.code_runs]
        return item_to_return

    def __repr__(self):
        return f'<User_Code(id={self.id}, user_id={self.user_id}, question_id={self.question_id}, source={self.source}, version_Id={self.versionId}, code_runs={self.code_runs})>'


class Code_Run(Base):
    """This table stores information about each time that a user clicked run. In the IDE. """
    __tablename__ = 'code_run'
    id = Column(String(32), primary_key=True, default=random_string)
    user_code_id = Column(String(32), ForeignKey('user_code.id'))
    date = Column(DateTime(timezone=True), default=func.now())
    start_version = Column(Integer)
    end_version = Column(Integer)
    total_cases = Column(Integer)
    cases_passed = Column(Integer, default=0)
    flagged = Column(Boolean, default=False)
    runtime = Column(Integer, default=5000)

    def as_dict(self, recursion_level=1):
        item_to_return = {c.name: getattr(self, c.name)
                          for c in self.__table__.columns}

        return item_to_return

    def __repr__(self):
        return f'<Code_Run(id={self.id}, date={self.date}, start_version={self.start_version}, end_version={self.end_version}, total_cases={self.total_cases}, cases_passed={self.cases_passed}, runtime={self.runtime})>'


def create_schema():
    engine = create_engine(
        DATABASE_URI, echo=True)
    Base.metadata.drop_all(bind=engine, tables=None, checkfirst=True)
    Base.metadata.create_all(engine)


def dynamic_table(tablename):
    for item in Base.registry.mappers:
        if str(item.local_table) == tablename:
            return item.class_
