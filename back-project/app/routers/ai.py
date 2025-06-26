from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.ai.agent import runner, session_service, APP_NAME
from app.auth.deps import get_current_user
from app.models.user import User
from google.genai import types
import uuid
import re

router = APIRouter(prefix="/ai", tags=["ai"])

class AssistRequest(BaseModel):
    message: str

@router.post("/assist")
async def assist(
    request: AssistRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        # Use real user ID from database
        USER_ID = str(current_user.id)
        SESSION_ID = str(uuid.uuid4())

        await session_service.create_session(
            app_name=APP_NAME,
            user_id=USER_ID,
            session_id=SESSION_ID,
        )

        # Create proper message structure
        message = types.Content(
            role="user",
            parts=[types.Part(text=request.message)]
        )

        # Run the agent with structured message
        final_response = "No AI response"
        async for event in runner.run_async(
            user_id=USER_ID,
            session_id=SESSION_ID,
            new_message=message
        ):
            if event.is_final_response() and event.content and event.content.parts:
                final_response = event.content.parts[0].text
                break

        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", final_response.strip(), flags=re.MULTILINE)
        return {"response": cleaned}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI assistant error: {str(e)}") 