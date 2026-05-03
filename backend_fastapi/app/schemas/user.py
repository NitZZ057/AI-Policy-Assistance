from pydantic import BaseModel, EmailStr, Field

class UserPublic(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = {"from_attributes" : True}

class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: UserPublic

class MeResponse(BaseModel):
    user: UserPublic

class MessageResponse(BaseModel):
    message: str