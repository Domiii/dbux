# hackfix for relative imports
# see: https://stackoverflow.com/questions/30669474/beyond-top-level-package-error-in-relative-import
import os
from os import path
import sys
sys.path.insert(0, os.getcwd())
sys.path.insert(0, '..')
sys.path.insert(0, path.join(path.dirname(__file__)))