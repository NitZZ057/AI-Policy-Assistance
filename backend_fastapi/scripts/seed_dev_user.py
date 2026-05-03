import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.database import AsyncSessionLocal
from app.core.security import generate_plain_token, hash_password, hash_token
from app.models.user import User


async def main() -> None:
    email = "dev@example.com"

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None:
            plain_token = generate_plain_token()
            user = User(
                name="Development User",
                email=email,
                password=hash_password("password123"),
                api_token=hash_token(plain_token),
            )
            session.add(user)
        elif not user.api_token:
            plain_token = generate_plain_token()
            user.api_token = hash_token(plain_token)
        else:
            plain_token = "<existing token is already hashed; run /login to rotate it>"

        await session.commit()
        await session.refresh(user)

        print("Development user ready.")
        print(f"email: {user.email}")
        print("password: password123")
        print(f"plain_token: {plain_token}")


if __name__ == "__main__":
    asyncio.run(main())
