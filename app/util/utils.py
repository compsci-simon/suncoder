import os

def get_project_root() -> str:
    """Returns the root directory of the project."""
    path = os.path.dirname(os.path.abspath(__file__))
    lastIndex = path.rfind('/')
    return path[:lastIndex]