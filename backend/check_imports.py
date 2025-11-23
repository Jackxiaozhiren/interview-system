import sys
import os

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.models.entities import UserORM
    print("UserORM imported")
    from app.core.security import verify_password
    print("security imported")
    from app.routers.auth import router
    print("auth router imported")
    print("All imports successful")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
