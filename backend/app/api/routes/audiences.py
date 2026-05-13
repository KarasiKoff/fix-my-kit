from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.audience import Audience as AudienceModel
from backend.app.models.enums import UserRole
from backend.app.models.user import User
from backend.app.schemas.audience import Audience, AudienceCreate, AudienceList

router = APIRouter(prefix="/api/audiences", tags=["audiences"])


def require_roles(allowed_roles: set[UserRole]):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
        return user

    return checker


@router.get("", response_model=AudienceList)
def list_audiences(
    name: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles({UserRole.ADMIN, UserRole.SYSADMIN})),
) -> AudienceList:
    query = db.query(AudienceModel)
    if name is not None:
        query = query.filter(AudienceModel.name.ilike(f"%{name}%"))
    items = query.order_by(AudienceModel.name).all()
    return AudienceList(items=items)


@router.post("", response_model=Audience, status_code=status.HTTP_201_CREATED)
def create_audience(
    payload: AudienceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles({UserRole.ADMIN})),
) -> Audience:
    existing = db.query(AudienceModel).filter(AudienceModel.name == payload.name).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="audience_exists")

    audience = AudienceModel(name=payload.name)
    db.add(audience)
    db.commit()
    db.refresh(audience)
    return audience
