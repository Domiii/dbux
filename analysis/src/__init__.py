# hackfix for relative imports
# see: https://stackoverflow.com/questions/30669474/beyond-top-level-package-error-in-relative-import
import os
from os import path
import sys
import warnings

sys.path.insert(0, os.getcwd())
sys.path.insert(0, '..')
sys.path.insert(0, path.join(path.dirname(__file__)))

warnings.filterwarnings(action='once')
