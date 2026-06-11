from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, File, UploadFile, Depends, Header, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import requests

ROOT_DIR = Path(__file__).parent

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "infocba"
storage_key = None

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        raise

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])}, {"password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    role: str
    created_at: str
    model_config = ConfigDict(populate_by_name=True)

class ReportInput(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    address: str

class ReportResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    address: str
    status: str
    image_path: Optional[str] = None
    image_paths: Optional[List[str]] = None
    vote_score: Optional[int] = None
    user_id: str
    user_name: str
    created_at: str
    updated_at: str

class UpdateStatusInput(BaseModel):
    status: str

class UpdateReportDetailsInput(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    user_name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    vote_score: Optional[int] = None
    image_paths: Optional[List[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class VoteInput(BaseModel):
    direction: str  # 'up' or 'down'

class StatsResponse(BaseModel):
    total: int
    pending: int
    resolved: int
    by_category: dict

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@infocba.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "InfoCba",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        await db.users.create_index("email", unique=True)
        await db.login_attempts.create_index("identifier")
        await db.votes.create_index([("report_id", 1), ("user_id", 1)], unique=True)
        await seed_admin()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Startup error: {e}")

@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(input.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": input.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    return {"_id": user_id, "email": email, "name": input.name, "role": "user", "created_at": user_doc["created_at"], "access_token": access_token, "refresh_token": refresh_token}

@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)

    return {"_id": user_id, "email": user["email"], "name": user["name"], "role": user["role"], "created_at": user["created_at"], "access_token": access_token, "refresh_token": refresh_token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", samesite="none", secure=True)
    response.delete_cookie("refresh_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out successfully"}

class RefreshInput(BaseModel):
    refresh_token: Optional[str] = None

@api_router.post("/auth/refresh")
async def refresh_access_token(request: Request, response: Response, body: RefreshInput = RefreshInput()):
    refresh = body.refresh_token or request.cookies.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(refresh, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])}, {"password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        new_refresh = create_refresh_token(user_id)
        return {"_id": user_id, "email": user["email"], "name": user["name"], "role": user["role"], "access_token": access_token, "refresh_token": new_refresh}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.get("/auth/me")
async def get_me(request: Request, response: Response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    return await get_current_user(request)

@api_router.post("/reports")
async def create_report(
    title: str = File(...), description: str = File(...), category: str = File(...),
    latitude: float = File(...), longitude: float = File(...), address: str = File(...),
    images: List[UploadFile] = File(default=[]), request: Request = None
):
    user = await get_current_user(request)
    image_paths = []
    for image in images[:5]:
        if image and image.filename:
            ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
            path = f"{APP_NAME}/uploads/{user['_id']}/{uuid.uuid4()}.{ext}"
            data = await image.read()
            result = put_object(path, data, image.content_type or "image/jpeg")
            image_paths.append(result["path"])

    report_doc = {
        "id": str(uuid.uuid4()), "title": title, "description": description,
        "category": category, "latitude": latitude, "longitude": longitude,
        "address": address, "status": "pending",
        "image_path": image_paths[0] if image_paths else None,
        "image_paths": image_paths,
        "user_id": user["_id"], "user_name": user["name"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(report_doc)
    report_doc.pop("_id", None)
    return report_doc

@api_router.get("/reports", response_model=List[ReportResponse])
async def get_reports(status: Optional[str] = None):
    query = {}
    if status: query["status"] = status
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    if reports:
        report_ids = [r["id"] for r in reports]
        pipeline = [
            {"$match": {"report_id": {"$in": report_ids}}},
            {"$group": {"_id": {"report_id": "$report_id", "direction": "$direction"}, "count": {"$sum": 1}}}
        ]
        vote_agg = await db.votes.aggregate(pipeline).to_list(None)
        score_map = {}
        for item in vote_agg:
            rid = item["_id"]["report_id"]
            score_map[rid] = score_map.get(rid, 0) + (item["count"] if item["_id"]["direction"] == "up" else -item["count"])
        for report in reports:
            if "vote_score_override" in report:
                report["vote_score"] = report["vote_score_override"]
            else:
                report["vote_score"] = score_map.get(report["id"], 0)
    return reports

@api_router.post("/reports/{report_id}/vote")
async def vote_report(report_id: str, input: VoteInput, request: Request):
    if input.direction not in ("up", "down"):
        raise HTTPException(status_code=400, detail="direction must be 'up' or 'down'")
    user = await get_current_user(request)
    existing = await db.votes.find_one({"report_id": report_id, "user_id": user["_id"]})
    if existing and existing["direction"] == input.direction:
        await db.votes.delete_one({"_id": existing["_id"]})
        user_vote = None
    elif existing:
        await db.votes.update_one({"_id": existing["_id"]}, {"$set": {"direction": input.direction}})
        user_vote = input.direction
    else:
        await db.votes.insert_one({"report_id": report_id, "user_id": user["_id"], "direction": input.direction})
        user_vote = input.direction
    ups   = await db.votes.count_documents({"report_id": report_id, "direction": "up"})
    downs = await db.votes.count_documents({"report_id": report_id, "direction": "down"})
    report_doc = await db.reports.find_one({"id": report_id}, {"vote_score_override": 1})
    override = (report_doc or {}).get("vote_score_override", 0) or 0
    return {"score": override + ups - downs, "user_vote": user_vote}

@api_router.get("/votes/mine")
async def get_my_votes(request: Request):
    user = await get_current_user(request)
    votes = await db.votes.find({"user_id": user["_id"]}, {"_id": 0, "report_id": 1, "direction": 1}).to_list(None)
    return {v["report_id"]: v["direction"] for v in votes}

@api_router.get("/reports/stats", response_model=StatsResponse)
async def get_stats():
    total = await db.reports.count_documents({})
    pending = await db.reports.count_documents({"status": "pending"})
    resolved = await db.reports.count_documents({"status": "resolved"})
    by_category = {cat: await db.reports.count_documents({"category": cat}) for cat in ["baches", "residuos", "alumbrado", "construccion", "extravios", "otros"]}
    return {"total": total, "pending": pending, "resolved": resolved, "by_category": by_category}

@api_router.patch("/reports/{report_id}")
async def update_report_details(report_id: str, input: UpdateReportDetailsInput, request: Request):
    await get_admin_user(request)
    update_fields = {k: v for k, v in input.model_dump().items() if v is not None}
    if "image_paths" not in update_fields and input.image_paths is not None:
        update_fields["image_paths"] = input.image_paths
    if "vote_score" in update_fields:
        update_fields["vote_score_override"] = update_fields.pop("vote_score")
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "image_paths" in update_fields:
        paths = update_fields["image_paths"]
        update_fields["image_path"] = paths[0] if paths else None
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.reports.update_one({"id": report_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    doc = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if "vote_score_override" in doc:
        doc["vote_score"] = doc["vote_score_override"]
    else:
        ups   = await db.votes.count_documents({"report_id": report_id, "direction": "up"})
        downs = await db.votes.count_documents({"report_id": report_id, "direction": "down"})
        doc["vote_score"] = ups - downs
    return doc

@api_router.post("/reports/{report_id}/images")
async def add_report_images(report_id: str, images: List[UploadFile] = File(...), request: Request = None):
    await get_admin_user(request)
    report = await db.reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    current_paths = report.get("image_paths") or []
    new_paths = []
    for image in images[:max(0, 5 - len(current_paths))]:
        if image and image.filename:
            ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
            path = f"{APP_NAME}/uploads/{report['user_id']}/{uuid.uuid4()}.{ext}"
            data = await image.read()
            result = put_object(path, data, image.content_type or "image/jpeg")
            new_paths.append(result["path"])
    all_paths = current_paths + new_paths
    await db.reports.update_one(
        {"id": report_id},
        {"$set": {"image_paths": all_paths, "image_path": all_paths[0] if all_paths else None,
                  "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return await db.reports.find_one({"id": report_id}, {"_id": 0})

@api_router.put("/reports/{report_id}/status")
async def update_report_status(report_id: str, input: UpdateStatusInput, request: Request):
    await get_admin_user(request)
    result = await db.reports.update_one(
        {"id": report_id},
        {"$set": {"status": input.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Report not found")
    return await db.reports.find_one({"id": report_id}, {"_id": 0})

@api_router.delete("/reports/{report_id}")
async def delete_report(report_id: str, request: Request):
    await get_admin_user(request)
    if (await db.reports.delete_one({"id": report_id})).deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted successfully"}

@api_router.get("/files/{path:path}")
async def download_file(path: str, authorization: str = Header(None), auth: str = Query(None)):
    data, content_type = get_object(path)
    return Response(content=data, media_type=content_type)

app.include_router(api_router)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    # Esta opción es más compatible con túneles
    allow_origin_regex=r"https?://.*", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Exponemos estos encabezados para que el navegador no se queje
    expose_headers=["*"]
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
