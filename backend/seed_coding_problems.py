from app.db import SessionLocal
from app.models.coding_problem import CodingProblemORM
import uuid

PROBLEMS = [
    {
        "title": "Two Sum",
        "description": """Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
```

**Example 2:**
```
Input: nums = [3,2,4], target = 6
Output: [1,2]
```
""",
        "difficulty": "Easy",
        "category": "Arrays",
        "tags": ["Array", "Hash Table"],
        "test_cases": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]"},
            {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"},
            {"input": "nums = [3,3], target = 6", "output": "[0,1]"}
        ],
        "constraints": {"n": "10^4"},
        "language_support": ["python", "javascript"]
    },
    {
        "title": "Valid Parentheses",
        "description": """Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
```
Input: s = "()"
Output: true
```

**Example 2:**
```
Input: s = "()[]{}"
Output: true
```

**Example 3:**
```
Input: s = "(]"
Output: false
```
""",
        "difficulty": "Easy",
        "category": "Stack",
        "tags": ["String", "Stack"],
        "test_cases": [
            {"input": "s = '()'", "output": "True"},
            {"input": "s = '()[]{}'", "output": "True"},
            {"input": "s = '(]'", "output": "False"}
        ],
        "constraints": {"length": "10^4"},
        "language_support": ["python", "javascript"]
    },
    {
        "title": "Reverse Linked List",
        "description": """Given the `head` of a singly linked list, reverse the list, and return *the reversed list*.

**Example 1:**
```
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
```

**Example 2:**
```
Input: head = [1,2]
Output: [2,1]
```
""",
        "difficulty": "Medium",
        "category": "Linked List",
        "tags": ["Linked List", "Recursion"],
        "test_cases": [
            {"input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]"},
            {"input": "head = [1,2]", "output": "[2,1]"}
        ],
        "constraints": {"n": "5000"},
        "language_support": ["python", "javascript"]
    }
]

def seed_problems():
    # Ensure tables exist
    from app.db import engine, Base
    from app.models.coding_problem import CodingProblemORM
    from app.models.entities import UserORM  # Ensure User table is known
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding coding problems...")
        for p_data in PROBLEMS:
            # Check if exists
            exists = db.query(CodingProblemORM).filter(CodingProblemORM.title == p_data["title"]).first()
            if not exists:
                problem = CodingProblemORM(
                    id=str(uuid.uuid4()),
                    **p_data
                )
                db.add(problem)
                print(f"Added: {p_data['title']}")
            else:
                print(f"Skipped (exists): {p_data['title']}")
        db.commit()
        print("Seeding complete.")
    except Exception as e:
        print(f"Error seeding problems: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_problems()
