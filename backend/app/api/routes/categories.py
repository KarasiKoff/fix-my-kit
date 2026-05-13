from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.device import Device as DeviceModel
from backend.app.models.category import Category as CategoryModel
from backend.app.models.enums import UserRole
from backend.app.models.user import User
from backend.app.schemas.category import Category, CategoryCreate, CategoryList, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["categories"])


def require_roles(allowed_roles: set[UserRole]):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
        return user

    return checker


@router.get("", response_model=CategoryList)
def list_categories(
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles({UserRole.ADMIN, UserRole.SYSADMIN})),
) -> CategoryList:
    query = db.query(CategoryModel)
    if is_active is not None:
        query = query.filter(CategoryModel.is_active == is_active)
    items = query.order_by(CategoryModel.created_at.desc()).all()
    return CategoryList(items=items)


@router.post("", response_model=Category, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles({UserRole.ADMIN})),
) -> Category:
    existing = db.query(CategoryModel).filter(CategoryModel.name == payload.name).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="category_exists")

    category = CategoryModel(name=payload.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=Category)
def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles({UserRole.ADMIN})),
) -> Category:
    category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="category_not_found")

    if payload.name is not None and payload.name != category.name:
        existing = db.query(CategoryModel).filter(CategoryModel.name == payload.name).first()
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="category_exists")
        category.name = payload.name

    if payload.is_active is not None:
        category.is_active = payload.is_active

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles({UserRole.ADMIN})),
) -> None:
    category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="category_not_found")

    db.query(DeviceModel).filter(DeviceModel.category_id == category_id).update(
        {DeviceModel.category_id: None},
        synchronize_session=False,
    )
    db.delete(category)
    db.commit()
