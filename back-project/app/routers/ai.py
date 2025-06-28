from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.ai.agent import runner, session_service, APP_NAME
from app.auth.deps import get_current_user, get_db
from app.models.user import User
from google.genai import types
from typing import List, Optional
import uuid
from app.services.ai_data_service import get_user_pets, PetInfo
from sqlalchemy.orm import Session
from app.ai.data_api import AIAgentDataAPI

router = APIRouter(prefix="/ai", tags=["ai"])

class AssistRequest(BaseModel):
    message: str
    session_id: str = None  # Now session_id is str to match the agent's table

class SessionResponse(BaseModel):
    id: str
    state: Optional[dict]
    create_time: Optional[str]
    update_time: Optional[str]
    event_count: int

class EventResponse(BaseModel):
    id: str
    author: Optional[str]
    content: Optional[str]
    timestamp: Optional[str]

class AssistResponse(BaseModel):
    response: str
    session_id: str

@router.post("/assist", response_model=AssistResponse)
async def assist(
    request: AssistRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Instantiate the data API
        data_api = AIAgentDataAPI(db)
        pets = data_api.get_user_pets(current_user.id)

        # 2. Build a pet summary string
        if pets:
            pet_summary = "User's pets:\n" + "\n".join(
                f"- {pet.name} ({pet.gender} {pet.species}, {pet.breed}, age {pet.age}): {pet.notes}" for pet in pets
            ) + "\n\n"
        else:
            pet_summary = "User has no pets registered.\n\n"

        # 3. Enrich the prompt
        enriched_message = pet_summary + request.message

        message = types.Content(
            role="user",
            parts=[types.Part(text=enriched_message)]
        )

        # If session_id is not provided, create a new session and use its id
        if not request.session_id:
            session = await session_service.create_session(
                app_name=APP_NAME,
                user_id=str(current_user.id)
            )
            session_id = session.id
        else:
            session_id = request.session_id
            # Ensure the session exists (create if not)
            try:
                await session_service.get_session(
                    app_name=APP_NAME,
                    user_id=str(current_user.id),
                    session_id=session_id
                )
            except Exception:
                await session_service.create_session(
                    app_name=APP_NAME,
                    user_id=str(current_user.id),
                    session_id=session_id
                )

        final_response = "No AI response"
        async for event in runner.run_async(
            user_id=str(current_user.id),
            session_id=session_id,
            new_message=message
        ):
            if event.is_final_response() and event.content and event.content.parts:
                final_response = event.content.parts[0].text
                break

        return AssistResponse(response=final_response, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI assistant error: {str(e)}")

@router.get("/sessions", response_model=List[SessionResponse])
async def list_ai_sessions(current_user: User = Depends(get_current_user)):
    try:
        sessions = await session_service.list_sessions(
            app_name=APP_NAME,
            user_id=str(current_user.id)
        )
        session_objs = sessions.sessions
        return [
            SessionResponse(
                id=s.id,
                state=getattr(s, 'state', None),
                create_time=str(getattr(s, 'create_time', None)),
                update_time=str(getattr(s, 'update_time', None)),
                event_count=len(getattr(s, 'events', []))
            ) for s in session_objs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing sessions: {str(e)}")

@router.get("/sessions/{session_id}/messages", response_model=List[EventResponse])
async def list_ai_session_messages(session_id: str, current_user: User = Depends(get_current_user)):
    try:
        session = await session_service.get_session(
            app_name=APP_NAME,
            user_id=str(current_user.id),
            session_id=session_id
        )
        return [
            EventResponse(
                id=str(e.id),
                author=getattr(e, 'author', None),
                content=getattr(e, 'content', None),
                timestamp=getattr(e, 'timestamp', None)
            ) for e in session.events
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing session messages: {str(e)}")

@router.delete("/sessions/{session_id}")
async def delete_ai_session(session_id: str, current_user: User = Depends(get_current_user)):
    try:
        await session_service.delete_session(
            app_name=APP_NAME,
            user_id=str(current_user.id),
            session_id=session_id
        )
        return {"message": "Session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting session: {str(e)}")

@router.delete("/sessions/{session_id}/messages")
async def clear_ai_session_messages(session_id: str, current_user: User = Depends(get_current_user)):
    try:
        # To clear messages, delete and recreate the session
        session = await session_service.get_session(
            app_name=APP_NAME,
            user_id=str(current_user.id),
            session_id=session_id
        )
        state = session.state
        await session_service.delete_session(
            app_name=APP_NAME,
            user_id=str(current_user.id),
            session_id=session_id
        )
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=str(current_user.id),
            session_id=session_id,
            state=state
        )
        return {"message": "Session messages cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing session messages: {str(e)}")

@router.get("/test/user-pets", response_model=List[PetInfo])
async def test_user_pets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_pets(db, current_user.id) 