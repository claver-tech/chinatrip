import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from typing import Optional, List

# ── Database URL ─────────────────────────────────────────────
# Production: DATABASE_URL env var (Railway Postgres)
# Local: SQLite fallback
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./chinatrip.db"
)

# Railway gives postgres:// but SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

IS_SQLITE = DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if IS_SQLITE else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── Models ───────────────────────────────────────────────────
class DayDB(Base):
    __tablename__ = "days"
    id             = Column(Integer, primary_key=True, index=True)
    day_num        = Column(Integer)
    date           = Column(String)
    city           = Column(String)
    transport      = Column(String, default="")
    morning        = Column(Text, default="")
    afternoon      = Column(Text, default="")
    evening        = Column(Text, default="")
    food_morning   = Column(Text, default="")
    food_afternoon = Column(Text, default="")
    food_evening   = Column(Text, default="")
    cost_cny       = Column(Float, default=0)
    joe_note       = Column(Text, default="")
    sort_order     = Column(Integer, default=0)

class HotelDB(Base):
    __tablename__ = "hotels"
    id            = Column(Integer, primary_key=True, index=True)
    city          = Column(String)
    area          = Column(String, default="")
    checkin       = Column(String)
    checkout      = Column(String)
    nights        = Column(Integer, default=1)
    hotel_name    = Column(Text, default="")
    status        = Column(String, default="Not Booked")
    confirmation  = Column(String, default="")
    notes         = Column(Text, default="")
    breakfast     = Column(Boolean, default=False)
    cost_cny      = Column(Float, default=0)
    sort_order    = Column(Integer, default=0)

class TransportDB(Base):
    __tablename__ = "transports"
    id            = Column(Integer, primary_key=True, index=True)
    leg_num       = Column(Integer)
    date          = Column(String)
    type          = Column(String)
    from_city     = Column(String)
    from_lat      = Column(Float, nullable=True)
    from_lng      = Column(Float, nullable=True)
    to_city       = Column(String)
    to_lat        = Column(Float, nullable=True)
    to_lng        = Column(Float, nullable=True)
    dep_time      = Column(String, default="")
    arr_time      = Column(String, default="")
    duration      = Column(String, default="")
    flight_num    = Column(String, default="")
    cost_cny      = Column(Float, default=0)
    status        = Column(String, default="Not Booked")
    notes         = Column(Text, default="")
    sort_order    = Column(Integer, default=0)

class FinanceItemDB(Base):
    __tablename__ = "finance_items"
    id            = Column(Integer, primary_key=True, index=True)
    category      = Column(String)
    category_icon = Column(String, default="")
    label         = Column(String)
    cost_cny      = Column(Float, default=0)
    paid          = Column(Boolean, default=False)
    sort_order    = Column(Integer, default=0)

class SettingsDB(Base):
    __tablename__ = "settings"
    key   = Column(String, primary_key=True)
    value = Column(String)

# ── Migrate: add columns if missing (SQLite only) ────────────
def migrate():
    if not IS_SQLITE:
        return
    from sqlalchemy import inspect
    with engine.connect() as conn:
        inspector = inspect(engine)
        cols = [c['name'] for c in inspector.get_columns('transports')]
        for col in ['from_lat','from_lng','to_lat','to_lng']:
            if col not in cols:
                conn.execute(text(f"ALTER TABLE transports ADD COLUMN {col} REAL"))
        conn.commit()

Base.metadata.create_all(bind=engine)
try:
    migrate()
except Exception as e:
    print(f"Migration note: {e}")

# ── Schemas ──────────────────────────────────────────────────
class DaySchema(BaseModel):
    id:             Optional[int] = None
    day_num:        int
    date:           str
    city:           str
    transport:      str = ""
    morning:        str = ""
    afternoon:      str = ""
    evening:        str = ""
    food_morning:   str = ""
    food_afternoon: str = ""
    food_evening:   str = ""
    cost_cny:       float = 0
    joe_note:       str = ""
    sort_order:     int = 0
    model_config = {"from_attributes": True}

class HotelSchema(BaseModel):
    id:           Optional[int] = None
    city:         str
    area:         str = ""
    checkin:      str
    checkout:     str
    nights:       int = 1
    hotel_name:   str = ""
    status:       str = "Not Booked"
    confirmation: str = ""
    notes:        str = ""
    breakfast:    bool = False
    cost_cny:     float = 0
    sort_order:   int = 0
    model_config = {"from_attributes": True}

class TransportSchema(BaseModel):
    id:         Optional[int] = None
    leg_num:    int
    date:       str
    type:       str
    from_city:  str
    from_lat:   Optional[float] = None
    from_lng:   Optional[float] = None
    to_city:    str
    to_lat:     Optional[float] = None
    to_lng:     Optional[float] = None
    dep_time:   str = ""
    arr_time:   str = ""
    duration:   str = ""
    flight_num: str = ""
    cost_cny:   float = 0
    status:     str = "Not Booked"
    notes:      str = ""
    sort_order: int = 0
    model_config = {"from_attributes": True}

class FinanceItemSchema(BaseModel):
    id:            Optional[int] = None
    category:      str
    category_icon: str = ""
    label:         str
    cost_cny:      float = 0
    paid:          bool = False
    sort_order:    int = 0
    model_config = {"from_attributes": True}

class ReorderRequest(BaseModel):
    ids: List[int]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── App ──────────────────────────────────────────────────────
app = FastAPI(title="China Trip Planner API")

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten after vercel URL is known
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes: Days ─────────────────────────────────────────────
@app.get("/days", response_model=List[DaySchema])
def get_days(db: Session = Depends(get_db)):
    return db.query(DayDB).order_by(DayDB.sort_order, DayDB.id).all()

@app.post("/days", response_model=DaySchema)
def create_day(day: DaySchema, db: Session = Depends(get_db)):
    data = day.model_dump(exclude={"id"})
    data["sort_order"] = db.query(DayDB).count()
    obj = DayDB(**data); db.add(obj); db.commit(); db.refresh(obj); return obj

@app.put("/days/{day_id}", response_model=DaySchema)
def update_day(day_id: int, day: DaySchema, db: Session = Depends(get_db)):
    obj = db.query(DayDB).filter(DayDB.id == day_id).first()
    if not obj: raise HTTPException(404, "Not found")
    for k, v in day.model_dump(exclude={"id"}).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj); return obj

@app.delete("/days/{day_id}")
def delete_day(day_id: int, db: Session = Depends(get_db)):
    obj = db.query(DayDB).filter(DayDB.id == day_id).first()
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit(); return {"ok": True}

@app.post("/days/reorder")
def reorder_days(req: ReorderRequest, db: Session = Depends(get_db)):
    for i, id_ in enumerate(req.ids):
        db.query(DayDB).filter(DayDB.id == id_).update({"sort_order": i})
    db.commit(); return {"ok": True}

# ── Routes: Hotels ───────────────────────────────────────────
@app.get("/hotels", response_model=List[HotelSchema])
def get_hotels(db: Session = Depends(get_db)):
    return db.query(HotelDB).order_by(HotelDB.sort_order, HotelDB.id).all()

@app.post("/hotels", response_model=HotelSchema)
def create_hotel(hotel: HotelSchema, db: Session = Depends(get_db)):
    data = hotel.model_dump(exclude={"id"})
    data["sort_order"] = db.query(HotelDB).count()
    obj = HotelDB(**data); db.add(obj); db.commit(); db.refresh(obj); return obj

@app.put("/hotels/{hotel_id}", response_model=HotelSchema)
def update_hotel(hotel_id: int, hotel: HotelSchema, db: Session = Depends(get_db)):
    obj = db.query(HotelDB).filter(HotelDB.id == hotel_id).first()
    if not obj: raise HTTPException(404, "Not found")
    for k, v in hotel.model_dump(exclude={"id"}).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj); return obj

@app.delete("/hotels/{hotel_id}")
def delete_hotel(hotel_id: int, db: Session = Depends(get_db)):
    obj = db.query(HotelDB).filter(HotelDB.id == hotel_id).first()
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit(); return {"ok": True}

# ── Routes: Transport ────────────────────────────────────────
@app.get("/transports", response_model=List[TransportSchema])
def get_transports(db: Session = Depends(get_db)):
    return db.query(TransportDB).order_by(TransportDB.sort_order, TransportDB.id).all()

@app.post("/transports", response_model=TransportSchema)
def create_transport(t: TransportSchema, db: Session = Depends(get_db)):
    data = t.model_dump(exclude={"id"})
    data["sort_order"] = db.query(TransportDB).count()
    obj = TransportDB(**data); db.add(obj); db.commit(); db.refresh(obj); return obj

@app.put("/transports/{t_id}", response_model=TransportSchema)
def update_transport(t_id: int, t: TransportSchema, db: Session = Depends(get_db)):
    obj = db.query(TransportDB).filter(TransportDB.id == t_id).first()
    if not obj: raise HTTPException(404, "Not found")
    for k, v in t.model_dump(exclude={"id"}).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj); return obj

@app.delete("/transports/{t_id}")
def delete_transport(t_id: int, db: Session = Depends(get_db)):
    obj = db.query(TransportDB).filter(TransportDB.id == t_id).first()
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit(); return {"ok": True}

@app.post("/transports/reorder")
def reorder_transports(req: ReorderRequest, db: Session = Depends(get_db)):
    for i, id_ in enumerate(req.ids):
        db.query(TransportDB).filter(TransportDB.id == id_).update({"sort_order": i})
    db.commit(); return {"ok": True}

# ── Routes: Finance ──────────────────────────────────────────
@app.get("/finance", response_model=List[FinanceItemSchema])
def get_finance(db: Session = Depends(get_db)):
    return db.query(FinanceItemDB).order_by(FinanceItemDB.category, FinanceItemDB.sort_order).all()

@app.post("/finance", response_model=FinanceItemSchema)
def create_finance(item: FinanceItemSchema, db: Session = Depends(get_db)):
    obj = FinanceItemDB(**item.model_dump(exclude={"id"}))
    db.add(obj); db.commit(); db.refresh(obj); return obj

@app.put("/finance/{item_id}", response_model=FinanceItemSchema)
def update_finance(item_id: int, item: FinanceItemSchema, db: Session = Depends(get_db)):
    obj = db.query(FinanceItemDB).filter(FinanceItemDB.id == item_id).first()
    if not obj: raise HTTPException(404, "Not found")
    for k, v in item.model_dump(exclude={"id"}).items(): setattr(obj, k, v)
    db.commit(); db.refresh(obj); return obj

@app.delete("/finance/{item_id}")
def delete_finance(item_id: int, db: Session = Depends(get_db)):
    obj = db.query(FinanceItemDB).filter(FinanceItemDB.id == item_id).first()
    if not obj: raise HTTPException(404, "Not found")
    db.delete(obj); db.commit(); return {"ok": True}

# ── Routes: Settings ─────────────────────────────────────────
@app.get("/settings/{key}")
def get_setting(key: str, db: Session = Depends(get_db)):
    s = db.query(SettingsDB).filter(SettingsDB.key == key).first()
    if not s: raise HTTPException(404, "Not found")
    return {"key": s.key, "value": s.value}

@app.put("/settings/{key}")
def set_setting(key: str, value: dict, db: Session = Depends(get_db)):
    s = db.query(SettingsDB).filter(SettingsDB.key == key).first()
    if s: s.value = str(value["value"])
    else: s = SettingsDB(key=key, value=str(value["value"])); db.add(s)
    db.commit(); return {"key": key, "value": value["value"]}

# ── Routes: Summary / Seed / Health ─────────────────────────
@app.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    hotels     = db.query(HotelDB).all()
    transports = db.query(TransportDB).all()
    finance    = db.query(FinanceItemDB).all()
    return {
        "total_days":            db.query(DayDB).count(),
        "total_nights":          sum(h.nights for h in hotels),
        "total_cities":          len(set(h.city for h in hotels)),
        "total_transport_legs":  len(transports),
        "booked_transport_legs": sum(1 for t in transports if "BOOKED" in t.status.upper()),
        "total_cost_cny":        sum(f.cost_cny for f in finance),
        "paid_cost_cny":         sum(f.cost_cny for f in finance if f.paid),
        "remaining_cny":         sum(f.cost_cny for f in finance if not f.paid),
    }

@app.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    if db.query(DayDB).count() > 0:
        return {"message": "Already seeded"}
    from seed_data import DAYS_SEED, HOTELS_SEED, TRANSPORTS_SEED, FINANCE_SEED
    for i, d in enumerate(DAYS_SEED):       db.add(DayDB(**d, sort_order=i))
    for i, h in enumerate(HOTELS_SEED):     db.add(HotelDB(**h, sort_order=i))
    for i, t in enumerate(TRANSPORTS_SEED): db.add(TransportDB(**t, sort_order=i))
    for i, f in enumerate(FINANCE_SEED):    db.add(FinanceItemDB(**f, sort_order=i))
    db.add(SettingsDB(key="exchange_rate", value="5.03"))
    db.add(SettingsDB(key="currency", value="CAD"))
    db.commit()
    return {"message": "Seeded successfully"}

@app.get("/health")
def health():
    return {"status": "ok", "db": "postgres" if not IS_SQLITE else "sqlite"}
