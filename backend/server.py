from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'splitwise-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Resend settings
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class GroupMemberAdd(BaseModel):
    email: EmailStr
    name: str

class SplitDetail(BaseModel):
    user_id: str
    amount: Optional[float] = None
    percentage: Optional[float] = None
    shares: Optional[int] = None

class ExpenseCreate(BaseModel):
    group_id: str
    description: str
    amount: float
    paid_by: str  # user_id who paid
    split_type: str  # equal, exact, percentage, shares
    splits: Optional[List[SplitDetail]] = None  # For non-equal splits
    participants: Optional[List[str]] = None  # For equal split - list of user_ids

class SettlementCreate(BaseModel):
    group_id: str
    from_user: str  # user_id who owes
    to_user: str    # user_id who is owed
    amount: float

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== EMAIL SERVICE ==============

async def send_expense_notification(expense: dict, group: dict, payer: dict, participants: List[dict]):
    if not resend.api_key:
        logger.warning("Resend API key not configured, skipping email notification")
        return
    
    participant_names = ", ".join([p["name"] for p in participants if p["id"] != payer["id"]])
    html_content = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0F766E;">New Expense Added</h2>
        <p><strong>{payer["name"]}</strong> added a new expense in <strong>{group["name"]}</strong></p>
        <div style="background: #F4F4F5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #71717A;">Description</p>
            <p style="margin: 4px 0 12px 0; font-size: 18px; font-weight: 600;">{expense["description"]}</p>
            <p style="margin: 0; font-size: 14px; color: #71717A;">Amount</p>
            <p style="margin: 4px 0 12px 0; font-size: 24px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #0F766E;">${expense["amount"]:.2f}</p>
            <p style="margin: 0; font-size: 14px; color: #71717A;">Split Type</p>
            <p style="margin: 4px 0; font-size: 16px;">{expense["split_type"].title()}</p>
        </div>
        <p style="color: #71717A; font-size: 14px;">Shared with: {participant_names}</p>
    </div>
    """
    
    for participant in participants:
        if participant["id"] != payer["id"]:
            try:
                params = {
                    "from": SENDER_EMAIL,
                    "to": [participant["email"]],
                    "subject": f"New expense: {expense['description']} - {group['name']}",
                    "html": html_content
                }
                await asyncio.to_thread(resend.Emails.send, params)
                logger.info(f"Email sent to {participant['email']}")
            except Exception as e:
                logger.error(f"Failed to send email to {participant['email']}: {e}")

async def send_member_invitation(member_email: str, member_name: str, group: dict, inviter: dict):
    if not resend.api_key:
        logger.warning("Resend API key not configured, skipping invitation email")
        return
    
    html_content = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0F766E;">You've been invited to a group!</h2>
        <p>Hi <strong>{member_name}</strong>,</p>
        <p><strong>{inviter["name"]}</strong> has added you to the group <strong>{group["name"]}</strong> on EqualSplit.</p>
        <div style="background: #F4F4F5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px; color: #71717A;">Group Name</p>
            <p style="margin: 4px 0 12px 0; font-size: 18px; font-weight: 600;">{group["name"]}</p>
            {f'<p style="margin: 0; font-size: 14px; color: #71717A;">Description</p><p style="margin: 4px 0; font-size: 16px;">{group["description"]}</p>' if group.get("description") else ''}
        </div>
        <p style="color: #71717A; font-size: 14px;">You can now start tracking shared expenses with this group.</p>
    </div>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [member_email],
            "subject": f"You've been added to {group['name']} on EqualSplit",
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Invitation email sent to {member_email}")
    except Exception as e:
        logger.error(f"Failed to send invitation email to {member_email}: {e}")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    token = create_token(user_id, data.email)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "created_at": user["created_at"]
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], data.email)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "created_at": current_user["created_at"]
    }

# ============== GROUP ROUTES ==============

@api_router.post("/groups")
async def create_group(data: GroupCreate, current_user: dict = Depends(get_current_user)):
    group_id = str(uuid.uuid4())
    group = {
        "id": group_id,
        "name": data.name,
        "description": data.description,
        "created_by": current_user["id"],
        "members": [current_user["id"]],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.groups.insert_one(group)
    return {"id": group_id, "name": data.name, "description": data.description, "members": [current_user["id"]], "created_at": group["created_at"]}

@api_router.get("/groups")
async def get_groups(current_user: dict = Depends(get_current_user)):
    groups = await db.groups.find({"members": current_user["id"]}, {"_id": 0}).to_list(100)
    
    # Enrich with member details and balance summary
    enriched_groups = []
    for group in groups:
        members = await db.users.find({"id": {"$in": group["members"]}}, {"_id": 0, "password": 0}).to_list(50)
        balances = await calculate_group_balances(group["id"])
        user_balance = sum([b["amount"] for b in balances if b["to_user"] == current_user["id"]]) - \
                       sum([b["amount"] for b in balances if b["from_user"] == current_user["id"]])
        
        enriched_groups.append({
            **group,
            "member_details": members,
            "user_balance": user_balance
        })
    
    return enriched_groups

@api_router.get("/groups/{group_id}")
async def get_group(group_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id, "members": current_user["id"]}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    members = await db.users.find({"id": {"$in": group["members"]}}, {"_id": 0, "password": 0}).to_list(50)
    expenses = await db.expenses.find({"group_id": group_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    balances = await calculate_group_balances(group_id)
    settlements = await db.settlements.find({"group_id": group_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return {
        **group,
        "member_details": members,
        "expenses": expenses,
        "balances": balances,
        "settlements": settlements
    }

@api_router.post("/groups/{group_id}/members")
async def add_member(group_id: str, data: GroupMemberAdd, current_user: dict = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id, "members": current_user["id"]}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user exists
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    # If user doesn't exist, create a new user account
    if not user:
        user_id = str(uuid.uuid4())
        # Generate a random password (user will need to reset or we can send them credentials)
        temp_password = str(uuid.uuid4())[:12]
        user = {
            "id": user_id,
            "name": data.name,
            "email": data.email,
            "password": hash_password(temp_password),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        logger.info(f"Created new user account for {data.email}")
    
    if user["id"] in group["members"]:
        raise HTTPException(status_code=400, detail="User already in group")
    
    # Add member to group
    await db.groups.update_one({"id": group_id}, {"$push": {"members": user["id"]}})
    
    # Send invitation email
    asyncio.create_task(send_member_invitation(data.email, data.name, group, current_user))
    
    return {
        "message": "Member added successfully and invitation email sent",
        "user_id": user["id"],
        "name": user["name"],
        "email": user["email"]
    }

@api_router.delete("/groups/{group_id}/members/{user_id}")
async def remove_member(group_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user["id"] != group["created_by"]:
        raise HTTPException(status_code=403, detail="Only group creator can remove members")
    
    if user_id == group["created_by"]:
        raise HTTPException(status_code=400, detail="Cannot remove group creator")
    
    await db.groups.update_one({"id": group_id}, {"$pull": {"members": user_id}})
    return {"message": "Member removed successfully"}

# ============== EXPENSE ROUTES ==============

@api_router.post("/expenses")
async def create_expense(data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    group = await db.groups.find_one({"id": data.group_id, "members": current_user["id"]}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    expense_id = str(uuid.uuid4())
    splits = []
    
    if data.split_type == "equal":
        participants = data.participants or group["members"]
        if len(participants) == 0:
            raise HTTPException(status_code=400, detail="At least one participant required")
        share = data.amount / len(participants)
        splits = [{"user_id": uid, "amount": share} for uid in participants]
    
    elif data.split_type == "exact":
        if not data.splits:
            raise HTTPException(status_code=400, detail="Splits required for exact split")
        total = sum([s.amount or 0 for s in data.splits])
        if abs(total - data.amount) > 0.01:
            raise HTTPException(status_code=400, detail=f"Split amounts ({total}) don't match expense ({data.amount})")
        splits = [{"user_id": s.user_id, "amount": s.amount} for s in data.splits]
    
    elif data.split_type == "percentage":
        if not data.splits:
            raise HTTPException(status_code=400, detail="Splits required for percentage split")
        total_percent = sum([s.percentage or 0 for s in data.splits])
        if abs(total_percent - 100) > 0.01:
            raise HTTPException(status_code=400, detail=f"Percentages ({total_percent}%) don't add up to 100%")
        splits = [{"user_id": s.user_id, "amount": (s.percentage / 100) * data.amount, "percentage": s.percentage} for s in data.splits]
    
    elif data.split_type == "shares":
        if not data.splits:
            raise HTTPException(status_code=400, detail="Splits required for shares split")
        total_shares = sum([s.shares or 0 for s in data.splits])
        if total_shares == 0:
            raise HTTPException(status_code=400, detail="Total shares cannot be 0")
        share_value = data.amount / total_shares
        splits = [{"user_id": s.user_id, "amount": (s.shares or 0) * share_value, "shares": s.shares} for s in data.splits]
    
    expense = {
        "id": expense_id,
        "group_id": data.group_id,
        "description": data.description,
        "amount": data.amount,
        "paid_by": data.paid_by,
        "split_type": data.split_type,
        "splits": splits,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.expenses.insert_one(expense)
    
    # Send email notifications asynchronously
    payer = await db.users.find_one({"id": data.paid_by}, {"_id": 0, "password": 0})
    participant_ids = [s["user_id"] for s in splits]
    participants = await db.users.find({"id": {"$in": participant_ids}}, {"_id": 0, "password": 0}).to_list(50)
    asyncio.create_task(send_expense_notification(expense, group, payer, participants))
    
    # Return expense without _id
    return {
        "id": expense["id"],
        "group_id": expense["group_id"],
        "description": expense["description"],
        "amount": expense["amount"],
        "paid_by": expense["paid_by"],
        "split_type": expense["split_type"],
        "splits": expense["splits"],
        "created_by": expense["created_by"],
        "created_at": expense["created_at"]
    }

@api_router.get("/expenses/{expense_id}")
async def get_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    group = await db.groups.find_one({"id": expense["group_id"], "members": current_user["id"]}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return expense

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only creator can delete expense")
    
    await db.expenses.delete_one({"id": expense_id})
    return {"message": "Expense deleted"}

# ============== BALANCE CALCULATION ==============

async def calculate_group_balances(group_id: str) -> List[Dict]:
    """Calculate simplified balances for a group"""
    expenses = await db.expenses.find({"group_id": group_id}, {"_id": 0}).to_list(1000)
    settlements = await db.settlements.find({"group_id": group_id}, {"_id": 0}).to_list(1000)
    
    # Net balance for each user (positive = owed money, negative = owes money)
    balances: Dict[str, float] = {}
    
    for expense in expenses:
        payer = expense["paid_by"]
        balances[payer] = balances.get(payer, 0) + expense["amount"]
        
        for split in expense["splits"]:
            user_id = split["user_id"]
            balances[user_id] = balances.get(user_id, 0) - split["amount"]
    
    # Apply settlements
    for settlement in settlements:
        balances[settlement["from_user"]] = balances.get(settlement["from_user"], 0) + settlement["amount"]
        balances[settlement["to_user"]] = balances.get(settlement["to_user"], 0) - settlement["amount"]
    
    # Simplify balances - who owes whom
    creditors = [(uid, bal) for uid, bal in balances.items() if bal > 0.01]
    debtors = [(uid, -bal) for uid, bal in balances.items() if bal < -0.01]
    
    creditors.sort(key=lambda x: -x[1])
    debtors.sort(key=lambda x: -x[1])
    
    simplified = []
    i, j = 0, 0
    
    while i < len(creditors) and j < len(debtors):
        creditor_id, credit = creditors[i]
        debtor_id, debt = debtors[j]
        
        amount = min(credit, debt)
        if amount > 0.01:
            simplified.append({
                "from_user": debtor_id,
                "to_user": creditor_id,
                "amount": round(amount, 2)
            })
        
        creditors[i] = (creditor_id, credit - amount)
        debtors[j] = (debtor_id, debt - amount)
        
        if creditors[i][1] < 0.01:
            i += 1
        if debtors[j][1] < 0.01:
            j += 1
    
    return simplified

@api_router.get("/groups/{group_id}/balances")
async def get_balances(group_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.groups.find_one({"id": group_id, "members": current_user["id"]}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    balances = await calculate_group_balances(group_id)
    
    # Enrich with user names
    all_user_ids = set()
    for b in balances:
        all_user_ids.add(b["from_user"])
        all_user_ids.add(b["to_user"])
    
    users = await db.users.find({"id": {"$in": list(all_user_ids)}}, {"_id": 0, "password": 0}).to_list(50)
    user_map = {u["id"]: u for u in users}
    
    enriched = []
    for b in balances:
        enriched.append({
            **b,
            "from_user_name": user_map.get(b["from_user"], {}).get("name", "Unknown"),
            "to_user_name": user_map.get(b["to_user"], {}).get("name", "Unknown")
        })
    
    return enriched

# ============== SETTLEMENT ROUTES ==============

@api_router.post("/settlements")
async def create_settlement(data: SettlementCreate, current_user: dict = Depends(get_current_user)):
    group = await db.groups.find_one({"id": data.group_id, "members": current_user["id"]}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    settlement_id = str(uuid.uuid4())
    settlement = {
        "id": settlement_id,
        "group_id": data.group_id,
        "from_user": data.from_user,
        "to_user": data.to_user,
        "amount": data.amount,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.settlements.insert_one(settlement)
    return settlement

@api_router.get("/settlements")
async def get_settlements(group_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"$or": [{"from_user": current_user["id"]}, {"to_user": current_user["id"]}]}
    if group_id:
        query["group_id"] = group_id
    
    settlements = await db.settlements.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return settlements

# ============== DASHBOARD / ACTIVITY ==============

@api_router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    # Get all groups user is part of
    groups = await db.groups.find({"members": current_user["id"]}, {"_id": 0}).to_list(100)
    group_ids = [g["id"] for g in groups]
    
    # Calculate overall balance
    total_owed_to_you = 0
    total_you_owe = 0
    
    for group_id in group_ids:
        balances = await calculate_group_balances(group_id)
        for b in balances:
            if b["to_user"] == current_user["id"]:
                total_owed_to_you += b["amount"]
            if b["from_user"] == current_user["id"]:
                total_you_owe += b["amount"]
    
    # Recent activity (expenses + settlements)
    recent_expenses = await db.expenses.find({"group_id": {"$in": group_ids}}, {"_id": 0}).sort("created_at", -1).to_list(10)
    recent_settlements = await db.settlements.find({"group_id": {"$in": group_ids}}, {"_id": 0}).sort("created_at", -1).to_list(10)
    
    # Enrich with user names
    all_user_ids = set()
    for e in recent_expenses:
        all_user_ids.add(e["paid_by"])
        all_user_ids.add(e["created_by"])
    for s in recent_settlements:
        all_user_ids.add(s["from_user"])
        all_user_ids.add(s["to_user"])
    
    users = await db.users.find({"id": {"$in": list(all_user_ids)}}, {"_id": 0, "password": 0}).to_list(50)
    user_map = {u["id"]: u for u in users}
    group_map = {g["id"]: g for g in groups}
    
    activity = []
    for e in recent_expenses:
        activity.append({
            "type": "expense",
            "id": e["id"],
            "description": e["description"],
            "amount": e["amount"],
            "paid_by_name": user_map.get(e["paid_by"], {}).get("name", "Unknown"),
            "group_name": group_map.get(e["group_id"], {}).get("name", "Unknown"),
            "group_id": e["group_id"],
            "created_at": e["created_at"]
        })
    
    for s in recent_settlements:
        activity.append({
            "type": "settlement",
            "id": s["id"],
            "amount": s["amount"],
            "from_user_name": user_map.get(s["from_user"], {}).get("name", "Unknown"),
            "to_user_name": user_map.get(s["to_user"], {}).get("name", "Unknown"),
            "group_name": group_map.get(s["group_id"], {}).get("name", "Unknown"),
            "group_id": s["group_id"],
            "created_at": s["created_at"]
        })
    
    # Sort by date
    activity.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "total_owed_to_you": round(total_owed_to_you, 2),
        "total_you_owe": round(total_you_owe, 2),
        "net_balance": round(total_owed_to_you - total_you_owe, 2),
        "total_groups": len(groups),
        "recent_activity": activity[:15]
    }

@api_router.get("/users/search")
async def search_users(email: str, current_user: dict = Depends(get_current_user)):
    users = await db.users.find(
        {"email": {"$regex": email, "$options": "i"}, "id": {"$ne": current_user["id"]}},
        {"_id": 0, "password": 0}
    ).to_list(10)
    return users

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "EqualSplit API - Expense Sharing Made Easy"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
